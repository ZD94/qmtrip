/**
 * Created by wyl on 2017/10/30.
 */


'use strict';
import {Models} from "_types/index";
import {DB} from '@jingli/database';
import L from '@jingli/language';
var _ = require("lodash");
var request = require("request-promise");
const config = require("@jingli/config");
import {clientExport, requireParams} from "@jingli/dnode-api/dist/src/helper";
import {EventListener} from "_types/eventListener";
import {EApproveChannel} from "_types/approve/types";
var C = require("@jingli/config");

export class EventModule{
    async sendEventNotice (params: {eventName: string, data: any, companyId: string}): Promise<any> {
        console.info("sendEventNotice===========", params.eventName, params.companyId)
        let {eventName, data, companyId} = params;
        if(!eventName || !companyId){
            throw L.ERR.INVALID_ARGUMENT("eventName | companyId");
        }
        let findSql = `SELECT * FROM "event"."event_listeners" where events ?& array['${eventName}'] and company_id='${companyId}';`;

        let eventListeners = await DB.query(findSql);

        if(eventListeners && eventListeners[0] && eventListeners[0].length){
            eventListeners = eventListeners[0];
        }else{
            let company = await Models.company.get(companyId);
            if(company && (company.oa == EApproveChannel.QM || company.oa == EApproveChannel.DING_TALK)){
                let approveServerUrl = C.approveServerUrl;
                approveServerUrl = approveServerUrl + `/tripApprove/receive`;
                let eventListener = EventListener.create({events: ["NEW_TRIP_APPROVE","TRIP_APPROVE_UPDATE","TRIP_APPROVE_CHANGE","TRIP_APPROVE_CANCLE"],
                    url: approveServerUrl, method: "post", companyId: companyId});
                await eventListener.save();
                eventListeners = [eventListener];
            }else{
                eventListeners = [];
            }
        }

        if(eventListeners && eventListeners.length){
            try{
                let url = eventListeners[0].url;
                let templateUrl = _.template(url);
                url = templateUrl(data);
                console.info("url====>>>", url);
                let method = eventListeners[0].method;
                let qs: object | null = null;
                if (method.toLowerCase() != 'post') { 
                    qs = params;
                }
                let result = await request({
                    uri: `${url}`,
                    body: params,
                    json:true,
                    method: `${method}`,
                    qs: qs
                });
                if(typeof(result) == 'string'){
                    result = JSON.parse(result);
                }
                if(result && result.code == 0)
                    return result.data;
                else
                    return null;
                // throw L.ERR.ERROR_CODE(result.code, result.msg)
            }catch (err){
                throw err;
            }

        }else{
            return null;
            // throw L.ERR.ERROR_CODE(503, "事件未被监听");
        }
    }

    @clientExport
    @requireParams(['modelName', 'methodName', 'data', 'companyId'])
    async sendRequestToApprove (params: {modelName: string, methodName: string, data: any, companyId: string}): Promise<any> {
        try{
            let company = await Models.company.get(params.companyId);
            let url = company.approveServerUrl ? company.approveServerUrl : config.approveServerUrl;
            url = url + `/tripApprove/receiveRequest`;
            let result = await request({
                uri: `${url}`,
                body: params,
                json:true,
                method: 'post'
            });
            if(typeof(result) == 'string'){
                result = JSON.parse(result);
            }
            if(result && result.code == 0)
                return result.data;
            else
                return null;
        }catch(err){
            console.info(err);
            throw err;
        }
    }
}

let eventModule = new EventModule();
export default eventModule;