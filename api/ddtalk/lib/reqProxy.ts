/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import request = require("request");
import C = require("@jingli/config");
var Agent = require('socks5-https-client/lib/Agent');

let ddConfig = C.ddconfig;

export function reqProxy(url, options) {
    return new Promise( (resolve, reject) => {
        let method = options.method || 'POST';
        let qs = options.qs || {};
        let body: any = options.body || {};
        let name = options.name || '未知';
        body = JSON.stringify(body)

        let OPTION = {
            uri: url,
            headers: {
                'Content-Type': 'application/json',
            },
            method: method,
            qs: qs,
            body: body
        };
        if(ddConfig.dd_agent){
            OPTION["agentClass"] = Agent;
            OPTION["agentOptions"]={
                socksHost : ddConfig.dd_agent,
                socksPort : ddConfig.dd_agent_port
            }
        }

        request( OPTION , (err, resp, data: any) => {
            if (typeof data == 'string') {
                data = JSON.parse(data);
            }
            console.log(name, '==>', JSON.stringify(data))
            if (err) return reject(err);
            if (body.errcode) return reject(data);
            return resolve(data);
        })
    })
}