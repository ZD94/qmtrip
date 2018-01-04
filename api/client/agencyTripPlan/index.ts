/**
 * Created by yumiao on 15-12-12.
 */

let API = require("@jingli/dnode-api");
import L from '@jingli/language';
const config = require("@jingli/config");
import moment = require("moment");
import _ = require('lodash');
import {ENoticeType} from "_types/notice/notice";
import { Staff } from '_types/staff';
import { Company } from '_types/company';


export function getConsumeInvoiceImg(params: {consumeId: string}) {
    let consumeId = params.consumeId;
    return API.tripPlan.getConsumeInvoiceImg({
        consumeId: consumeId
    });
}


/**
 * 代理商获取员工计划单分页列表
 * @returns {*}
 */
export function pageTripPlans(this: { accountId: string }, params: {
    audit: string, status: number | object, auditStatus: number,
    isHasBudget: boolean, budget: any, agencyAll: boolean, page: number,
    perPage: number, order: any
}){
    if(!params) {
        throw {code: -10, msg: '参数不能为空'};
    }

    if(typeof params == 'function'){
        throw {code: -2, msg: '参数不正确'};
    }
    let self = this;
    let accountId = self.accountId;

    //判断计划单的审核状态，设定auditStatus参数, 只有上传了票据的计划单这个参数才有效
    if(params.audit){
        let audit = params.audit;
        params.status = 1;
        if(audit == 'Y'){
            params.status = 2;
            params.auditStatus = 1;
        }else if(audit == "P"){
            params.status = 1;
            params.auditStatus = 0;
        }else if(audit == 'N'){
            params.status = 0; //待上传状态
            params.auditStatus = -1;
        }
    }

    if(params.isHasBudget === false) {
        params.status = -1; //状态是未出预算
        params.budget = {$lte: 0}; //预算结果小于0
    }

    if(params.agencyAll === true) {
        params.status = {$in: [-1, 1]};
        params.auditStatus = 0;
    }

    let query: any = _.pick(params,
        ['companyId', 'accountId', 'status', 'auditStatus', 'startAt', 'backAt', 'deptCity', 'arrivalCity',
            'isNeedTraffic', 'isNeedHotel', 'budget', 'expenditure', 'remark', 'isCommit']);


    return API.agency.getAgencyUser({id: accountId, columns: ['agencyId']})
        .then(function(user: any){
            return user.agencyId;
        })
        .then(function(agencyId: any){
            return API.company.listCompany({agencyId:agencyId});
        })
        .then(function(companys: Company[]){
            let companyIdList = companys.map(function(company){
                return company.id;
            });

            if(query.companyId){
                if(companyIdList.indexOf(query.companyId) == -1)
                    throw L.ERR.PERMISSION_DENY();
            } else {
                query.companyId = {$in: companyIdList};
            }

            let page = params.page;
            let perPage = params.perPage;
            page = typeof(page) == 'number'?page:1;
            perPage = typeof(perPage) == 'number'?perPage:10;
            let options: any = {
                where: query,
                limit: perPage,
                offset: perPage * (page - 1)
            };

            if(params.order) {
                options.order = [params.order];
            }else {
                options.order = [['commit_time', 'asc'], ['created_at', 'asc']];
            }

            return API.tripPlan.listTripPlans(options);
        })
}

/**
 * 审核票据
 * @param params
 * @param params.status审核结果状态
 * @param params.consumeId 审核消费单id
 * @param params.userId 用户id
 * @returns {*|*|Promise}
 */
export function approveInvoice(this: { accountId: string }, params: {
    userId: string, remark: string, consumeId: string, status: number
}){
    let self = this;
    let user_id = self.accountId;
    params.userId = user_id;
    params.remark = params.remark || '审核票据';
    let consumeId = params.consumeId;
    let orderId = "";
    let staffId = "";
    let companyId = "";
    // let invoiceName = "";
    let _startTime = "";
    let reason = "";

    return API.tripPlan.getTripDetail({consumeId: consumeId, columns: ['accountId', 'orderId', 'type', 'startTime']})
        .then(function(consumeDetail: {accountId: string, orderId: string, type: number, startTime: string}){
            if(!consumeDetail.accountId){
                throw {code: -6, msg: '消费记录异常'};
            }
            orderId = consumeDetail.orderId;

            /*if(consumeDetail.type === -1){
                invoiceName = '去程交通'
            }else if(consumeDetail.type === 0){
                invoiceName = '酒店发票';
            }else if(consumeDetail.type === 1){
                invoiceName = '回程交通';
            }*/

            _startTime = consumeDetail.startTime;
            return consumeDetail.accountId;
        })
        .then(function(_staffId: string){
            staffId = _staffId;
            return API.staff.getStaff({id: staffId, columns: ['companyId', 'name', 'email']})
        })
        .then(function(staff: Staff){
            if(!staff.target.companyId){
                throw {msg:"该员工不存在或员工所在企业不存在"};
            }

            companyId = staff.target.companyId;

            return Promise.all([
                API.company.getCompany({id: companyId, columns: ['agencyId']}),
                API.agency.getAgencyUser({id: user_id, columns: ['agencyId']})
            ])
        })
        .spread(function(company: Company, user: {agencyId: string}){
            if(!company.target.agencyId){
                throw {msg:"该员工所在企业不存在或员工所在企业没有代理商"};
            }

            if(company.target.agencyId != user.agencyId){
                throw L.ERR.PERMISSION_DENY();
            }

            return API.tripPlan.approveInvoice(params);
        })
        .then(function(isSuccess: boolean){
            //判断审核操作是否完成，完成则执行后续操作
            if(!isSuccess){
                return isSuccess;
            }

            return API.tripPlan.getTripPlanOrder({orderId: orderId, columns: ['id', 'status', 'score', 'budget', 'expenditure', 'description', 'startAt']});
        })
        .then(function(ret: boolean | {[key: string]: any}){
            //判断ret类型，如果是Boolean则直接返回
            if(typeof ret == 'boolean'){
                return ret;
            }
            let order = ret;
            if(typeof ret.toJSON == 'function'){
                order = order.toJSON();
            }
            /*let go = '无', back = '无', hotel = '无';
            if(order.outTraffic.length > 0){
                let g = order.outTraffic[0];
                go = moment(g.startTime).format('YYYY-MM-DD') + ', ' + g.deptCity + ' 到 ' + g.arrivalCity;

                if(g.latestArriveTime){
                    go += ', 最晚' + moment(g.latestArriveTime).format('HH:mm') + '到达';
                }

                go += ', 动态预算￥' + g.budget;

                if(g.expenditure){
                    go += ',实际支出￥' + g.expenditure;
                }
            }
            if(order.backTraffic.length > 0){
                let b = order.backTraffic[0];
                back = moment(b.startTime).format('YYYY-MM-DD') + ', ' + b.deptCity + ' 到 ' + b.arrivalCity;

                if(b.latestArriveTime){
                    back += ', 最晚' + moment(b.latestArriveTime).format('HH:mm') + '到达';
                }

                back += ', 动态预算￥' + b.budget;

                if(b.expenditure){
                    back += ',实际支出￥' + b.expenditure;
                }
            }
            if(order.hotel.length > 0){
                let h = order.hotel[0];
                hotel = moment(h.startTime).format('YYYY-MM-DD') + ' 至 ' + moment(h.endTime).format('YYYY-MM-DD') +
                    ', ' + h.city + ' ' + h.hotelName + ',动态预算￥' + h.budget;

                if(h.expenditure){
                    hotel += ',实际支出￥' + h.expenditure;
                }
            }*/
            let orderTime = ret.startAt;
            if(!orderTime){
                orderTime = _startTime
            }
            orderTime = moment(orderTime).format('YYYY-MM-DD');
            let url = config.host + '/staff.html#/travelPlan/PlanDetail?tripPlanId=' + order.id;
            let appMessageUrl = '#/travelPlan/PlanDetail?tripPlanId=' + order.id;

            let key = '';
            /*let values: any = {
                username: staffName,
                email: staffEmail,
                projectName: ret.description,
                ticket: invoiceName,
                goTrafficBudget: go,
                backTrafficBudget: back,
                hotelBudget: hotel,
                totalBudget: '全麦预算￥'+order.budget,
                url: url,
                appMessageUrl: appMessageUrl,
                detailUrl: url
            }*/

            //审核完成后给用户发送邮件
            if(params.status == -1){ //审核不通过
                key = 'qm_notify_invoice_not_pass';
                reason = params.remark;
            }

            /*if(params.status == 1){
                key = 'qm_notify_invoice_one_pass';
                values.consume = expenditure
            }*/

            if(ret.status == 2){
                key = 'qm_notify_invoice_all_pass';
                let s = order.budget - order.expenditure;
                if(s <0){
                    s = 0;
                }
                let _score = order.score;
                if(_score> 0 ){
                    _score += '积分已发放到您的积分账户';
                }
                //let total = `全麦预算￥${order.budget},实际支出￥${order.expenditure},节省￥${s.toFixed(2)}`;
                // values.time = orderTime;
                // values.score = _score;
            }


            if(ret.status != 2 || ret.score == 0){ //status == 2 是审核通过的状态，通过后要给企业用户增加积分操作，积分为0时不需要此操作
                return true;
            }
            return API.staff.increaseStaffPoint({id: staffId, accountId: user_id, increasePoint: ret.score, companyId: companyId})
                .then(async function(ret: any) {
                    if (key) {
                        //发送通知给用户
                        await API.notify.submitNotify({
                            key: key,
                            userId: staffId,
                            values: {tripPlan: order, detailUrl: url, appMessageUrl: appMessageUrl,
                                noticeType: ENoticeType.TRIP_APPROVE_NOTICE, reason: reason}
                        });

                    }
                    return ret;
                })
        })
        .then(function(){
            return true;
        })
}

/**
 * 代理商统计计划单数目(根据企业id和员工id,员工id为空的时候查询企业所有员工的数据)
 * @param params
 * @returns {*}
 */
export async function countTripPlanNum(this: { accountId: string }, params: {
    companyId: string,
}){
    let self = this;
    let accountId = self.accountId; //代理商用户Id

    if(!params.companyId){
        throw {code: -1, msg: 'companyId不能为空'};
    }
    let companyId = params.companyId;

    let [user, company] = await Promise.all([
        API.agency.getAgencyUser({id: accountId, columns: ['id', 'agencyId']}),
        API.company.getCompany({id: companyId, columns: ['agencyId']})
    ]);
    if(user.agencyId != company.agencyId){
        throw L.ERR.PERMISSION_DENY();
    }
    return API.tripPlan.countTripPlanNum(params);
}

/**
 * 统计计划单的动态预算/计划金额和实际支出
 * @param params
 */
export async function statPlanOrderMoneyByAgency(this: { accountId: string }, params: {
    companyId: string, startTime: string, endTime: string
}) {
    let self = this;
    if(!params.companyId){
        throw {code: -1, msg: '企业Id不能为空'};
    }
    let companyId = params.companyId;
    let p: {companyId: string} = _.pick(params, ['companyId', 'startTime', 'endTime']);

    let [u, c] = await Promise.all([
        API.agency.getAgencyUser({id: self.accountId, columns: ['agencyId']}),
        API.company.getCompany({id: companyId, columns: ['agencyId']})
    ]);
    if(u.agencyId != c.agencyId){
        throw L.ERR.PERMISSION_DENY();
    }
    p.companyId = companyId;
    return API.tripPlan.statPlanOrderMoney(p);
}