import { checkTokenAuth } from "api/auth/authentication";
import { AuthResponse } from '_types/auth/auth-cert';
import {Models} from "_types/index";
import {Staff} from "_types/staff";
import { Offline, OfflineStatus} from '_types/tripPlan';
import { Application, Request, Response, NextFunction } from 'express-serve-static-core';

let API = require("@jingli/dnode-api");
let moment = require("moment");

export interface CheckIdentityParam{
    staffId : string;
    tokenId: string,
    timestamp: Date,
    sign: string
}

export interface OfflineTranslateParam {
    projectName : string;
    leaveCityName: string;
    backCityName ? : string;
    destinationName: string;
    lastArrivalDate : number;    //最晚到达
    mostLeaveDate  : number;     //最早离开
    reason ? : string;
    approveName? : string;
    msg ? : string;
    status ? : number;
    approveId ? : string;
    signId : string;
}

export class OfflineClass {

    __initHttpApp( app: Application ){
        app.post("/offlineApprove", offlineApprove);
    }

    /*
     * content : 翻译参数
    */
    async transOfflineParams(param : OfflineTranslateParam, staff : Staff) : Promise<any>{
        for(let key in param){
            param[key] = typeof param[key] == "string" ? param[key].toLowerCase() : param[key];
        }

        param.leaveCityName = param.leaveCityName.replace(/city|市/ig, "");
        param.destinationName = param.destinationName.replace(/city|市/ig, "");
        param.status = 0;

        let leaveCity = await API.place.getCityInfoByName( param.leaveCityName );
        if(!leaveCity){
            param.msg = "出发地城市填写错误";
            return param;
        }

        let destinationCity = await API.place.getCityInfoByName( param.destinationName );
        if(!destinationCity){
            param.msg = "目的地城市填写错误";
            return param;
        }

        let backCity;
        if(param.backCityName){
            param.backCityName = param.backCityName.replace(/city|市/ig, "");
            backCity = await API.place.getCityInfoByName( param.backCityName );
            if(!backCity){
                param.msg = "返回地城市填写错误";
                return param;
            }
        }

        let project = await Models.project.find({
            where : {
                companyId : staff.company.id,
                name      : param.projectName
            }
        });
        if(!project.length){
            param.msg = "项目名称填写错误";
            return param;
        }

        let approveUser;
        if(param.approveName){
            approveUser = await Models.staff.find({
                where : {
                    companyId : staff.company.id,
                    name      : param.approveName
                }
            });
            if(!approveUser.length){
                param.msg = "审批人填写错误";
                return param;
            }
        }
            
        param.status = 1;
        return { leaveCity, destinationCity, backCity, project:project[0], approveUser : approveUser && approveUser[0] };
    }

    /*
     * content : 验证身份
    */
    async checkIdentity(param : CheckIdentityParam){
        let staffId = param.staffId;
        let authResponse : AuthResponse = await checkTokenAuth( param );
        if(!authResponse){
            return null;
        }
        let staff = await Models.staff.get(staffId);
        if(staff.accountId == authResponse.accountId){
            return staff;
        }

        return null;
    }

    /* 
     * content : 翻译参数，生成预算，创建审批单
     */
    async dealOffLine( param : OfflineTranslateParam, staff : Staff ) : Promise<OfflineTranslateParam>{
        //翻译填写字段
        let realParam = await offline.transOfflineParams( param, staff );
        if(realParam.status == 0){
            return realParam;
        }

        //生成预算参数
        param.lastArrivalDate = Number(param.lastArrivalDate);
        param.mostLeaveDate = Number(param.mostLeaveDate);
        let travelBudgetParam = {
            "originPlace": realParam.leaveCity.id,
            "goBackPlace": realParam.backCity && realParam.backCity.id,
            "isRoundTrip": !!realParam.backCity,
            "projectName": realParam.project.name,
            "destinationPlacesInfo": [
                {
                    "destinationPlace": realParam.destinationCity.id,
                    "leaveDate": moment(param.lastArrivalDate).format("YYYY-MM-DD"),
                    "goBackDate": moment(param.mostLeaveDate).format("YYYY-MM-DD"),
                    "latestArrivalDateTime": moment(param.lastArrivalDate).format("YYYY-MM-DD"),
                    "earliestGoBackDateTime": moment(param.mostLeaveDate).format("YYYY-MM-DD"),
                    "isNeedTraffic": true,
                    "isNeedHotel": true,
                    "reason": param.reason
                }
            ],
            "staffId" : staff.id,
            "staffList": [
                staff.id
            ]
        };

        //获取预算
        let budgetId;
        try{
            budgetId = await API.travelBudget.getTravelPolicyBudget(travelBudgetParam);
        }catch(e){
            console.error(e);
            param.status = 0;
            param.msg = "预算生成失败";
            return param;
        }

        //生成审批单
        let approve;
        try{
            approve = await API.approve.submitApprove({budgetId, approveUser: realParam.approveUser && realParam.approveUser, submitter : staff});
        }catch(e){
            console.error(e);
            param.status = 0;
            param.msg = "审批单生成失败";
            return param;
        }
        
        param.status = 1;
        param.msg = "审批单创建成功";
        param.approveId = approve.id;
        return param;
    }

    /*
     * content : 发送处理消息
    */
    async sendInfo( param : OfflineTranslateParam, staff : Staff ){
        try{            
            let values = {
                param,
                staff
            };
            await API.notify.submitNotify({
                key: 'qm_offline',
                values: values
            });
        }catch(e){
            console.log("sendInfo===>error : ", e);
        }
    }
}

const offline = new OfflineClass();
export default offline;

async function offlineApprove(req: Request, res: Response, next: NextFunction){
    res.header('Access-Control-Allow-Origin', '*');
    /*req.clearTimeout();
    req.setTimeout( 60 * 1000 );*/
    
    //验证身份
    let staff = await offline.checkIdentity( req.body.identity );
    if(!staff){
        res.json({
            "status" : 500,
            "msg"    : "身份认证失败"
        });
        return;
    }

    let param : OfflineTranslateParam = req.body.param || {};
    if(!param.signId){
        res.status(500).json({ error: 'signId is required.' })
        return;
    }

    let offlines = await Models.offline.find({
        where : {
            signId : param.signId
        }
    });
    let result;
    if(offlines.length){
        res.json({
            "status" : 403,
            "msg"    : "重复提交"
        });
        return;
    }else{
        result = Offline.create({
            signId : param.signId,
            isProcessed : true
        }) as Offline;
        result = await result.save();
    }

    res.json({
        "status" : 200,
        "msg"    : "离线申请后台已接收"
    });

    try{
        param = await offline.dealOffLine(param, staff);
        await offline.sendInfo(param, staff);
    }catch(e){
        console.error(e);
    }
    
    result.remark = param.msg;
    result.status = param.status ? OfflineStatus.SUCCESS : OfflineStatus.FAIL;

    await result.save();
}
