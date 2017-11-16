/**
 * Created by wyl on 2017/10/30.
 */

'use strict';
import {Models} from "_types/index";
import {DB} from '@jingli/database';
import L from '@jingli/language';
var request = require("request-promise");

export class EventModule{
    async sendEventNotice (params): Promise<any> {
        let {eventName, data, companyId} = params;
        if(!eventName || !companyId){
            throw L.ERR.INVALID_ARGUMENT("eventName | companyId");
        }
        let findSql = `SELECT * FROM "event"."event_listeners" where events ?& array['${eventName}'] and company_id='${companyId}';`;

        let eventListeners = await DB.query(findSql);

        if(eventListeners && eventListeners[0] && eventListeners[0].length){
            eventListeners = eventListeners[0];
        }else{
            eventListeners = [];
        }

        if(eventListeners && eventListeners.length){
            try{
                let url = eventListeners[0].url;
                let method = eventListeners[0].method;
                let result = await request({
                    uri: `${url}`,
                    body: params,
                    json:true,
                    method: `${method}`,
                    qs: params
                });
                if(typeof(result) == 'string'){
                    result = JSON.parse(result);
                }
                return result;
            }catch (err){
                throw err;
            }

        }else{
            return {code: 503, msg: "事件未被监听"};
        }
    }
}

let eventModule = new EventModule();
export default eventModule;