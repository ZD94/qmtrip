/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import request = require("request");
// var Agent = require('socks5-https-client/lib/Agent');

export function reqProxy(url, options) {
    return new Promise( (resolve, reject) => {
        let method = options.method || 'POST';
        let qs = options.qs || {};
        let body: any = options.body || {};
        let name = options.name || '未知';
        body = JSON.stringify(body)

        request({
            uri: url,
            headers: {
                'Content-Type': 'application/json',
            },
            method: method,
            qs: qs,
            body: body,
            // agentClass : Agent,
            // agentOptions: {
            //     socksHost: 'localhost', // Defaults to 'localhost'.
            //     socksPort: 8888 // Defaults to 1080.
            // }
        }, (err, resp, data: any) => {
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


/*
reqProxy("https://oapi.dingtalk.com/service/get_corp_token?suite_access_token=ed38583781f839f2bd33096bdabae26c" , {
    body: {
        name : "获取企业accessToken",
        auth_corpid: "1d97f320-089b-11e7-9185-7b8970541af9",
        permanent_code: "6LT2lCsKJS9JbvJ_cszVe0JjW6PMWCDkJ11UT3MV7gZ31LC60hiDC6QgCSt_620D",
    }
})*/
