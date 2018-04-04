/**
 * Created by wlh on 2016/11/17.
 */

'use strict';
import {clientExport, requireParams} from "@jingli/dnode-api/dist/src/helper";
import {Approve} from "_types/approve/index";
import {Staff} from "_types/staff/staff";
import {Models} from "_types/index";
import {emitter, EVENT} from "libs/oa";
import {EApproveStatus, EApproveChannel, EApproveType} from "_types/approve/types";
import {ETripType} from "_types/tripPlan/tripPlan";
import _ = require('lodash');
let Config = require('@jingli/config');
var API = require("@jingli/dnode-api");
import {ISegment, ICreateBudgetAndApproveParams, QMEApproveStatus} from '_types/tripPlan';
import L from '@jingli/language';
import * as CLS from 'continuation-local-storage';
const scheduler = require('common/scheduler');

import {DB} from "@jingli/database";
import { ITravelBudgetInfo } from 'http/controller/budget';
var CLSNS = CLS.getNamespace('dnode-api-context');
CLSNS.bindEmitter(emitter);
import moment = require('moment')

function oaStr2Enum(str: string) :EApproveChannel{
    let obj = {
        'qm':       EApproveChannel.QM,
        'auto':     EApproveChannel.AUTO,
        'ddtalk':   EApproveChannel.DING_TALK
    }
    return obj[str];
}

function oaEnum2Str(e: EApproveChannel) {
    let obj = {}
    obj[EApproveChannel.QM] = 'qm';
    obj[EApproveChannel.AUTO] = 'auto';
    obj[EApproveChannel.DING_TALK] = 'ddtalk';
    return obj[e];
}

export class ApproveModule {
    @clientExport
    @requireParams(['id'])
    async getApprove(params: {id: string}) {
        return Models.approve.get(params.id);
    }

    @clientExport
    @requireParams(["budgetId"], ["approveUser", "project", "submitter", "version"])
    async submitApprove(params: {budgetId: string, approveUser?: Staff, submitter?: Staff, version: number}) :Promise<Approve>{
        let self = this;
        let {budgetId, approveUser} = params;
        let submitter = await Staff.getCurrent() || params.submitter;
        let company = submitter.company;

        //获取预算详情
        let budgetInfo = await API.travelBudget.getBudgetInfo({id: budgetId, accountId: submitter.id});
        let number = 0;
        let content = "";
        let query: ICreateBudgetAndApproveParams = budgetInfo.query;
        let destinationPlacesInfo = query.destinationPlacesInfo;

        if(query && query.originPlace){
            let originCity = await API.place.getCityInfo({cityCode: query.originPlace});
            content = content + originCity.name + "-";
        }
        if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
            for(let i = 0; i < destinationPlacesInfo.length; i++){
                let segment: ISegment = destinationPlacesInfo[i]
                let destinationCity = await API.place.getCityInfo({cityCode: segment.destinationPlace});
                if(i<destinationPlacesInfo.length-1){
                    content = content + destinationCity.name+"-";
                }else{
                    content = content + destinationCity.name;
                }
            }
        }
        let totalBudget = 0;
        if(budgetInfo.budgets && budgetInfo.budgets.length>0){
            budgetInfo.budgets.forEach(function(item: ITravelBudgetInfo){
                if(item.tripType != ETripType.SUBSIDY){
                    number = number + 1;
                }
                totalBudget += item.price;
            })
        }
        if(budgetInfo.query && budgetInfo.query.staffList){
            number *= budgetInfo.query.staffList.length;
        }

        // await company.beforeGoTrip({number: number});
        //冻结行程数
        let oldNum = company.tripPlanNumBalance;
        // let originTripPlanFrozenNum = company.tripPlanFrozenNum;
        // let extraTripPlanFrozenNum = company.extraTripPlanFrozenNum;
        return DB.transaction(async function(t){
            let result = await company.frozenTripPlanNum({accountId: submitter.id, number: number,
            remark: "提交出差申请消耗行程点数", content: content});
            let com = result.company;
            let frozenNum = result.frozenNum;
            budgetInfo.query.frozenNum = frozenNum;
            if(query.projectId && !query.projectName){
                let project = await Models.project.get(query.projectId);
                query.projectName = project && project.name || '';
            }

            let approve = await self._submitApprove({
                submitter: submitter.id,
                data: budgetInfo,
                title: query.projectName,
                channel: submitter.company.oa,
                type: EApproveType.TRAVEL_BUDGET,
                approveUser: approveUser,
                staffList:budgetInfo.query.staffList,
                budget: totalBudget,
                version: params.version
            });
            //行程数第一次小于10或等于0时给管理员和创建人发通知
            let newNum = com.tripPlanNumBalance;
            if(oldNum > 10 && newNum < 10 || newNum == 0){
                let detailUrl: string = ""
                let managers = await company.getManagers({withOwner: true});

                let version = params.version || Config.link_verion || 2 //@#template 外链生成的版本选择优先级：参数传递的版本 > 配置文件中配置的版本 > 默认版本为2
                if (version == 2) {
                    detailUrl = Config.v2_host + "#/manage/travel-number"
                } else {
                    detailUrl = Config.host + "/#/company-pay/buy-packages"
                }
                let ps = managers.map( (manager) => {
                    return API.notify.submitNotify({
                        userId: manager.id,
                        key: "qm_notify_trip_plan_num_short",
                        values: {
                            number: newNum,
                            detailUrl: detailUrl
                        }
                    });
                });
                await Promise.all(ps);
            }
            return approve;
        }).catch(async function(err){
            if(err) {
                // company.extraTripPlanFrozenNum = extraTripPlanFrozenNum;
                // company.tripPlanFrozenNum = originTripPlanFrozenNum;
                await company.reload();
                console.info(err);
                throw new Error("提交审批失败");
            }
        });

    }

    @clientExport
    async cancelApprove(params: {approveId: string}): Promise<any> {  //tripApprove未生成前取消行程，改变approve状态，和冻结点数(非必要)
        try {
            let approve = await Models.approve.get(params.approveId);
            if (!approve) throw new Error('approve is null')
            approve.status = EApproveStatus.CANCEL;
            approve.tripApproveStatus = QMEApproveStatus.CANCEL;
            let data = typeof approve.data == 'string' ? JSON.parse(approve.data) : approve.data;
            let query = data.query;
            let frozenNum = query.frozenNum;
            frozenNum = typeof frozenNum == 'string' ? JSON.parse(frozenNum) : frozenNum;
            frozenNum.extraFrozen = 0;
            frozenNum.limitFrozen = 0;
            await approve.save();

            let staff = await Models.staff.get(approve.submitter);
            let log = Models.tripPlanLog.create({tripPlanId: params.approveId, userId: staff && staff.id, remark: `撤销行程审批单`});
            await log.save();
        } catch(err) {
            throw err;
        }
    }

    @clientExport
    @requireParams(["approveId"], ["approveUser", "project", "submitter", "version"])
    async submitApproveNew(params: {approveId: string, budgetId?: string, approveUser?: Staff, submitter?: Staff, version: number}) :Promise<Approve>{
        let self = this;
        let {approveUser} = params;
        let submitter = await Staff.getCurrent() || params.submitter;
        let company = submitter.company;

        //获取预算详情
        // let budgetInfo = await API.travelBudget.getBudgetInfo({id: budgetId, accountId: submitter.id});
        let budgetInfoData = await Models.approve.get(params.approveId);
        if (typeof budgetInfoData == 'string') {
            budgetInfoData = JSON.parse(budgetInfoData);
        }
        if (!budgetInfoData) throw new Error('budgetInfoData is null')
        let budgetInfo = budgetInfoData.data;
        let number = 0;
        let content = "";
        let query: ICreateBudgetAndApproveParams = budgetInfo.query;
        let destinationPlacesInfo = query.destinationPlacesInfo;

        if(query && query.originPlace){
            let originCity = await API.place.getCityInfo({cityCode: query.originPlace});
            content = content + originCity.name + "-";
        }
        if(destinationPlacesInfo &&  _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
            for(let i = 0; i < destinationPlacesInfo.length; i++){
                let segment: ISegment = destinationPlacesInfo[i]
                let destinationCity = await API.place.getCityInfo({cityCode: segment.destinationPlace});
                if(i<destinationPlacesInfo.length-1){
                    content = content + destinationCity.name+"-";
                }else{
                    content = content + destinationCity.name;
                }
            }
        }
        let totalBudget = 0;
        if(budgetInfo.budgets && budgetInfo.budgets.length>0){
            budgetInfo.budgets.forEach(function(item: any){
                if(item.tripType != ETripType.SUBSIDY){
                    number = number + 1;
                }
                totalBudget += item.price;
            })
        }
        if(budgetInfo.query && budgetInfo.query.staffList){
            number *= budgetInfo.query.staffList.length;
        }

        // await company.beforeGoTrip({number: number});
        //冻结行程数
        let oldNum = company.tripPlanNumBalance;
        // let originTripPlanFrozenNum = company.tripPlanFrozenNum;
        // let extraTripPlanFrozenNum = company.extraTripPlanFrozenNum;
        return DB.transaction(async function(t){
            let result = await company.frozenTripPlanNum({accountId: submitter.id, number: number,
            remark: "提交出差申请消耗行程点数", content: content});
            let com = result.company;
            let frozenNum = result.frozenNum;
            budgetInfo.query.frozenNum = frozenNum;

            let approve = await self._submitApproveNew({
                approveId: params.approveId, 
                submitter: submitter.id,
                data: budgetInfo,
                title: query['projectName'],
                channel: submitter.company.oa,
                type: EApproveType.TRAVEL_BUDGET,
                approveUser: approveUser,
                staffList:budgetInfo.query.staffList,
                budget: totalBudget,
                version: params.version
            });
            //行程数第一次小于10或等于0时给管理员和创建人发通知
            let newNum = com.tripPlanNumBalance;
            if(oldNum > 10 && newNum < 10 || newNum == 0){
                let detailUrl: string = ""
                let managers = await company.getManagers({withOwner: true});

                let version = params.version || Config.link_verion || 2 //@#template 外链生成的版本选择优先级：参数传递的版本 > 配置文件中配置的版本 > 默认版本为2
                if (version == 2) {
                    detailUrl = Config.v2_host + "#/manage/travel-number"
                } else {
                    detailUrl = Config.host + "/#/company-pay/buy-packages"
                }
                let ps = managers.map( (manager) => {
                    return API.notify.submitNotify({
                        userId: manager.id,
                        key: "qm_notify_trip_plan_num_short",
                        values: {
                            number: newNum,
                            detailUrl: detailUrl
                        }
                    });
                });
                await Promise.all(ps);
            }
            return approve;
        }).catch(async function(err){
            if(err) {
                // company.extraTripPlanFrozenNum = extraTripPlanFrozenNum;
                // company.tripPlanFrozenNum = originTripPlanFrozenNum;
                await company.reload();
                console.info(err);
                throw new Error("提交审批失败");
            }
        });

    }

    @clientExport
    @requireParams(['query', 'budget'], ['project', 'specialApproveRemark', 'approveUser', 'version'])
    async submitSpecialApprove(params: {query: any, budget: number, specialApproveRemark?: string, approveUser?: Staff, version?: number}):Promise<Approve> {
        let self = this;
        let {query, budget, specialApproveRemark, approveUser} = params;
        let submitter = await Staff.getCurrent();

        //特殊审批不记录行程数
        // await company.beforeGoTrip();
        // await company.frozenTripPlanNum({number: 1});
        let reason:string="";
        if(query.destinationPlacesInfo && query.destinationPlacesInfo.length && query.destinationPlacesInfo[0].reason){
            reason=query.destinationPlacesInfo[0].reason;
        }

        if(typeof(query.staffList)=="undefined" || !query.staffList || !query.staffList.length){
            query.staffList=[submitter.id];
        }

        let budgetInfo: {[key: string]: any} = {
            query: query,
            budgets: [
                {
                    startAt: query.leaveDate,
                    backAt: query.goBackDate,
                    price: budget,
                    tripType: ETripType.SPECIAL_APPROVE,
                    reason: reason,
                    originPlace: null,
                    destination: null
                }
            ]
        }
        if(typeof query.destinationPlacesInfo == 'string') query.destinationPlacesInfo = JSON.parse(query.destinationPlacesInfo);
        let destinationPlacesInfo = query.destinationPlacesInfo;
        //出发地
        if(query.originPlace) {
            let originPlace = await API.place.getCityInfo({cityCode: query.originPlace.id || query.originPlace}) || {name: null};
            budgetInfo.budgets[0].originPlace = originPlace;
        }

        if(destinationPlacesInfo && _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
            for(let i = 0; i < destinationPlacesInfo.length; i++){
                let segment: ISegment = destinationPlacesInfo[i];
                //处理startAt,backAt
                if(i == 0){
                    budgetInfo.budgets[0].startAt = segment.leaveDate;
                    budgetInfo.budgets[0].reason = segment.reason;
                }
                if(i == (destinationPlacesInfo.length - 1)){
                    budgetInfo.budgets[0].backAt = segment.goBackDate;
                }
                //处理目的地
                if(i == (destinationPlacesInfo.length - 1) && segment.destinationPlace){
                    let place = segment.destinationPlace;
                    if (typeof place != 'string') {
                        place = place['id'];
                    }
                    let arrivalInfo = await API.place.getCityInfo({cityCode: place}) || {name: null};
                    budgetInfo.budgets[0].destination = arrivalInfo;
                }
            }
        }

        return DB.transaction(async function(t){
            return self._submitApprove({
                submitter: submitter.id,
                data: budgetInfo,
                title: query.projectName,
                channel: EApproveChannel.QM,   //特殊审批，流程都一致
                type: EApproveType.TRAVEL_BUDGET,
                isSpecialApprove: true,
                specialApproveRemark: specialApproveRemark,
                approveUser: approveUser,
                staffList:query.staffList,
                budget: budget,
                version: params.version
            });
        }).catch(function(err){
            if(err) {
                throw L.ERR.INTERNAL_ERROR();
            }
        });
    }

    async _submitApprove(params: {
        submitter: string,
        data?: any,
        approveUser?: Staff,
        title?: string,
        channel: EApproveChannel,
        type?: EApproveType,
        isSpecialApprove?: boolean,
        specialApproveRemark?: string,
        staffList?:string[],
        budget: number,
        version?: number
    }) {
        let {submitter, data, approveUser, title, channel, type, isSpecialApprove, specialApproveRemark,staffList, budget, version} = params;
        let staff = await Models.staff.get(submitter);
        if (!staff) throw new Error('staff is null')
        console.log('meiyou diao===============');
        let approve = Models.approve.create({
            submitter: submitter,
            data: data,
            channel: channel,
            title: title,
            type: type,
            approveUser: approveUser ? approveUser.id: null,
            isSpecialApprove: isSpecialApprove,
            specialApproveRemark: specialApproveRemark,
            companyId: staff.company.id,
            staffList:staffList,
            budget: budget
        });
        approve = await approve.save();

        await emitter.emitSerial(EVENT.NEW_TRIP_APPROVE, {
            approveNo: approve.id,
            approveUser: approveUser ? approveUser.id: null,
            submitter: submitter,
            status: EApproveStatus.WAIT_APPROVE,
            oa: oaEnum2Str(channel) || 'qm',
            version: version
        });
        return approve;
    }

    async _submitApproveNew(params: {
        approveId: string,
        submitter: string,
        data?: any,
        approveUser?: Staff,
        title?: string,
        channel?: EApproveChannel,
        type?: EApproveType,
        isSpecialApprove?: boolean,
        specialApproveRemark?: string,
        staffList?:string[],
        budget: number,
        version?: number
    }) {
        let {approveId, approveUser, submitter, version, channel} = params;
        let approve = await Models.approve.get(approveId);
        // let approve = Models.approve.create({
        //     submitter: submitter,
        //     data: data,
        //     channel: channel,
        //     title: title,
        //     type: type,
        //     approveUser: approveUser ? approveUser.id: null,
        //     isSpecialApprove: isSpecialApprove,
        //     specialApproveRemark: specialApproveRemark,
        //     companyId: staff.company.id,
        //     staffList:staffList,
        //     budget: budget
        // });

        if (channel == EApproveChannel.AUTO) {
            await emitter.emitSerial(EVENT.NEW_TRIP_APPROVE, {
                approveNo: approve.id,
                approveUser: approveUser ? approveUser.id: null,
                submitter: submitter,
                status: EApproveStatus.WAIT_APPROVE,
                oa: oaEnum2Str(channel) || 'auto',
                version: version
            });
        }
        return approve;
    }

    @clientExport
    async reportHimOA(params: {oaName: string, oaUrl?: string}) {
        let {oaName, oaUrl} = params;
        let staff = await Staff.getCurrent();
        try {
            await API.notify.submitNotify({
                email: Config.reportHimOAReceive,
                key: 'qm_report_him_oa',
                values: {
                    oaName: oaName,
                    oaUrl: oaUrl,
                    companyName: staff.company.name,
                    name: staff.name,
                    mobile: staff.mobile,
                },
            });
        } catch( err) {
            throw err;
        }
    }

    _scheduleTask() {
        let taskId = "processTimeoutApproves";
        scheduler('0 */5 * * * *', taskId, async function () {
            console.log('run task processTimeoutApproves')
            const approves = await Models.approve.find({
                where: {
                    status: EApproveStatus.WAIT_APPROVE,
                    startAt: { $lt: new Date() }
                },
                limit: 10,
                order: [['startAt', 'asc']]
            })

            approves.forEach(async ap => {
                const tripApprove = await API.tripApprove.getTripApprove({id: ap.id})
                ap.status = EApproveStatus.TIMEOUT
                if (!tripApprove && moment().diff(ap.startAt, 'day') >= 3) {
                    return await ap.save()
                }
                const log = Models.tripPlanLog.create({ tripPlanId: ap.id, remark: '超时未审批', approveStatus: EApproveStatus.TIMEOUT });
                await Promise.all([
                    API.tripApprove.updateTripApprove({
                        id: ap.id,
                        companyId: ap.companyId,
                        status: QMEApproveStatus.TIMEOUT
                    }),
                    ap.save(), log.save()
                ])
            })


            // const ps: Promise<any>[] = _.flatten(approves.map(ap => {
            //     ap.status = EApproveStatus.TIMEOUT
            //     return [API.tripApprove.updateTripApprove({
            //         id: ap.id,
            //         companyId: ap.companyId,
            //         status: QMEApproveStatus.TIMEOUT
            //     }), ap.save()]
            // }))

            // await Promise.all(ps)
        })
    }
}

//监听审批单变化
emitter.on(EVENT.TRIP_APPROVE_UPDATE, function(result: {approveNo: string, outerId: string, status:EApproveStatus,
    approveUser:string, data: any, oa: string, budget: number, version: string}) {
    let p = (async function(){
        let {approveNo, outerId, status, approveUser, data, oa, budget} = result;
        let approve = await Models.approve.get(approveNo);
        if (!approve) throw new Error('approve is null')
        if (approve.status == status) {
            return;
        }

        let company = await Models.company.get(approve['companyId']);
        //OA流程已经切换,旧的处理渠道不再支持
        if (company && company.oa != oaStr2Enum(oa) && !approve.isSpecialApprove) {
            return;
        }

        approve.status = status;
        approve.tripApproveStatus = QMEApproveStatus.PASS
        approve.approveUser = approveUser;
        approve.approveDateTime = new Date();
        approve.outerId = outerId;
        approve.oldBudget = approve.budget;
        approve.budget = budget;
        if (data) {
            approve.data = data;
        }
        approve = await approve.save();

        //预算审批完成
        if (approve.type == EApproveType.TRAVEL_BUDGET && approve.status == EApproveStatus.SUCCESS) {
            await API.tripPlan.saveTripPlanByApprove({tripApproveId: approve.id, version: result.version})
        }
    })();

    //捕获事件中错误
    p.catch((err: Error) => {
        console.error(err.stack);
    });
})

let approveModule = new ApproveModule();
approveModule._scheduleTask()

export default approveModule;
