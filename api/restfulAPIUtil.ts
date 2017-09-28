/**
 * Created by mr_squirrel on 01/09/2017.
 */


import {Staff} from "_types/staff";
import setPrototypeOf = Reflect.setPrototypeOf;
var request = require("request");
var Config = require("@jingli/config");

export default class RestfulAPIUtil {
    static async operateOnModel(options: {
        model: string,
        params?: any,
        flag?: any
    }):Promise<any> {
        let {params, model, flag} = options;
        let {fields, method} = params;
        let currentCompanyId = fields['companyId'];
        if (!currentCompanyId || typeof(currentCompanyId) == 'undefined') {
            let staff = await Staff.getCurrent();
            currentCompanyId = staff["companyId"];
        }

        let url;
        if (!flag) {
            url = Config.cloudAPI + `/company/${currentCompanyId}/${model}`;
        }
        else {
            url = Config.cloudAPI + `/company`
        }
        let result: any;

        let qs: {
            [index: string]: string;
        } = {};

        if (fields.hasOwnProperty('id')) {
            url = url + `/${fields['id']}`;
        }else{
            if (method.toUpperCase() == 'GET') {
                url = url + "?";
                for (let key in fields) {
                   qs[key] = fields[key];
                }
            }
        }

        return new Promise((resolve, reject) => {
            return request({
                uri: url,
                body: fields,
                json: true,
                method: method,
                qs: qs,
                headers: {
                    key: Config.cloudKey
                }
            }, (err, resp, result) => {
                if (err) {
                    return reject(err);
                }
                if (typeof(result) == 'string') {
                    result = JSON.parse(result);
                }
                return resolve(result);
            });
        })
    }

    static async proxyHttp(params:{
        url:string;
        body:object;
        method:string;
        qs:object;
    }){
        let {url, body={}, method="get", qs={}} = params;
        return new Promise((resolve, reject) => {
            request({
                uri: Config.cloudAPI + url,
                body,
                json: true,
                method,
                qs,
                headers: {
                    key: Config.cloudKey
                }
            }, (err, resp, result) => {
                if (err) {
                    return reject(err);
                }

                if (typeof result == 'string') {
                    result = JSON.parse(result);
                }
                return resolve(result);
            });
        })
    }
}


