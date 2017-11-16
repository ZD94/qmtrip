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
import TripPlanModule = require("../tripPlan/index");
import _ = require('lodash');
let Config = require('@jingli/config');
var API = require("@jingli/dnode-api");
import {ISegment, ICreateBudgetAndApproveParams} from '_types/tripPlan';
import L from '@jingli/language';
import * as CLS from 'continuation-local-storage';

import {DB} from "@jingli/database";
var CLSNS = CLS.getNamespace('dnode-api-context');
CLSNS.bindEmitter(emitter);

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

class ApproveModule {

    @clientExport
    @requireParams(["budgetId"], ["approveUser", "project", "submitter"])
    static async submitApprove(params: {budgetId: string, approveUser?: Staff, submitter?: Staff}) :Promise<Approve>{
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

        if(budgetInfo.budgets && budgetInfo.budgets.length>0){
            budgetInfo.budgets.forEach(function(item){
                if(item.tripType != ETripType.SUBSIDY){
                    number = number + 1;
                }
            })
        }
        if(budgetInfo.query && budgetInfo.query.staffList){
            number *= budgetInfo.query.staffList.length;
        }

        await company.beforeGoTrip({number: number});
        //冻结行程数
        let oldNum = company.tripPlanNumBalance;
        let originTripPlanFrozenNum = company.tripPlanFrozenNum;
        let extraTripPlanFrozenNum = company.extraTripPlanFrozenNum;
        return DB.transaction(async function(t){
            let result = await company.frozenTripPlanNum({accountId: submitter.id, number: number,
            remark: "提交出差申请消耗行程点数", content: content});
            let com = result.company;
            let frozenNum = result.frozenNum;
            budgetInfo.query.frozenNum = frozenNum;

            let approve = await ApproveModule._submitApprove({
                submitter: submitter.id,
                data: budgetInfo,
                title: query['projectName'],
                channel: submitter.company.oa,
                type: EApproveType.TRAVEL_BUDGET,
                approveUser: approveUser,
                staffList:budgetInfo.query.staffList,
            });
            //行程数第一次小于10或等于0时给管理员和创建人发通知
            let newNum = com.tripPlanNumBalance;
            if(oldNum > 10 && newNum < 10 || newNum == 0){
                // let detailUrl = Config.host + "/#/company-pay/buy-packages";
                let host = Config.host;
                let managers = await company.getManagers({withOwner: true});
                let ps = managers.map( (manager) => {
                    return API.notify.submitNotify({
                        userId: manager.id,
                        key: "qm_notify_trip_plan_num_short",
                        values: {
                            number: newNum,
                            host: host
                        }
                    });
                });
                await Promise.all(ps);
            }
            return approve;
        }).catch(async function(err){
            if(err) {
                company.extraTripPlanFrozenNum = extraTripPlanFrozenNum;
                company.tripPlanFrozenNum = originTripPlanFrozenNum;
                await company.save();
                console.info(err);
                throw new Error("提交审批失败");
            }
        });

    }

    @clientExport
    @requireParams(['query', 'budget'], ['project', 'specialApproveRemark', 'approveUser'])
    static async submitSpecialApprove(params: {query: any, budget: number, specialApproveRemark?: string, approveUser?: Staff}):Promise<Approve> {
        let {query, budget, specialApproveRemark, approveUser} = params;
        let submitter = await Staff.getCurrent();

        let company = submitter.company;
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

        let budgetInfo = {
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
            return ApproveModule._submitApprove({
                submitter: submitter.id,
                data: budgetInfo,
                title: query.projectName,
                channel: EApproveChannel.QM,   //特殊审批，流程都一致
                type: EApproveType.TRAVEL_BUDGET,
                isSpecialApprove: true,
                specialApproveRemark: specialApproveRemark,
                approveUser: approveUser,
                staffList:query.staffList,
            });
        }).catch(function(err){
            if(err) {
                throw L.ERR.INTERNAL_ERROR();
            }
        });
    }

    static async _submitApprove(params: {
        submitter: string,
        data?: any,
        approveUser?: Staff,
        title?: string,
        channel?: EApproveChannel,
        type?: EApproveType,
        isSpecialApprove?: boolean,
        specialApproveRemark?: string,
        staffList?:string[]
    }) {
        let {submitter, data, approveUser, title, channel, type, isSpecialApprove, specialApproveRemark,staffList } = params;
        let staff = await Models.staff.get(submitter);
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
            staffList:staffList
        });
        approve = await approve.save();

        await emitter.emitSerial(EVENT.NEW_TRIP_APPROVE, {
            approveNo: approve.id,
            approveUser: approveUser ? approveUser.id: null,
            submitter: submitter,
            status: EApproveStatus.WAIT_APPROVE,
            oa: oaEnum2Str(channel) || 'qm'
        });
        return approve;
    }

    @clientExport
    static async reportHimOA(params: {oaName: string, oaUrl?: string}) {
        let {oaName, oaUrl} = params;
        let staff = await Staff.getCurrent();
        try {
            let ret = await API.notify.submitNotify({
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
}

//监听审批单变化
emitter.on(EVENT.TRIP_APPROVE_UPDATE, function(result) {
    let p = (async function(){
        let {approveNo, submitter, outerId, status, approveUser, data, oa} = result;
        let approve = await Models.approve.get(approveNo);
        if (approve.status == status) {
            return;
        }

        let company = await Models.company.get(approve['companyId']);
        //OA流程已经切换,旧的处理渠道不再支持
        if (company.oa != oaStr2Enum(oa) && !approve.isSpecialApprove) {
            return;
        }

        approve.status = status;
        approve.approveUser = approveUser;
        approve.approveDateTime = new Date();
        approve.outerId = outerId;
        if (data) {
            approve.data = data;
        }
        approve = await approve.save();

        /*if(true){
            await API.event.sendEventNotice({event: "new_trip_approve", data: {"s":"w"," value": "rrr"}, companyId: "1a1a4330-046b-11e7-b585-933198eebdaa"});
        }*/

        //预算审批完成
        if (approve.type == EApproveType.TRAVEL_BUDGET && approve.status == EApproveStatus.SUCCESS) {
            await API.tripPlan.saveTripPlanByApprove({tripApproveId: approve.id})
        }
    })();

    //捕获事件中错误
    p.catch((err) => {
        console.error(err.stack);
    });
})

export= ApproveModule;