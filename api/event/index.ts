/**
 * Created by wyl on 2017/10/30.
 */

'use strict';
import {Models} from "_types/index";
import {DB} from '@jingli/database';
import L from '@jingli/language';
var request = require("request");

export class EventModule{
    async sendEventNotice (params): Promise<any> {
        let {event, data, companyId} = params;
        if(!event || !companyId){
            throw L.ERR.INVALID_ARGUMENT("eventName | companyId");
        }
        let findSql = `SELECT * FROM "event"."event_listeners" where events ?& array['${event}'] and company_id='${companyId}';`;

        let eventListeners = await DB.query(findSql);

        if(eventListeners && eventListeners[0] && eventListeners[0].length){
            eventListeners = eventListeners[0];
        }else{
            eventListeners = [];
        }

        if(eventListeners && eventListeners.length){
            let url = eventListeners[0].url;
            let method = eventListeners[0].method;
            let returnResult = await new Promise((resolve, reject) => {
                return request({
                    uri: url,
                    body: params,
                    json:true,
                    method: method,
                    qs: params
                }, (err, resp, result) => {
                    if (err) {
                        return reject(err);
                    }
                    if(typeof(result) == 'string'){
                        result = JSON.parse(result);
                    }
                    return resolve(result);
                })
            });
            return returnResult;
        }else{
            return {code: 503, msg: "事件未被监听"};
        }
    }
}

let eventModule = new EventModule();
export default eventModule;