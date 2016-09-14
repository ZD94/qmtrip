/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import request = require("request");

export function reqProxy(url, options) {
    return new Promise( (resolve, reject) => {
        let method = options.method || 'POST';
        let qs = options.qs || {};
        let body = options.body || {};
        let name = options.name || '未知';
        request({
            uri: url,
            headers: {
                'Content-Type': 'application/json',
            },
            method: method,
            qs: qs,
            body: JSON.stringify(body),
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