/**
 * Created by mr_squirrel on 01/09/2017.
 */


import {Staff} from "_types/staff";
import setPrototypeOf = Reflect.setPrototypeOf;
var request = require("request-promise");
var Config = require("@jingli/config");

export default class RestfulAPIUtil {
    static async operateOnModel(options: {
        model: string,
        params?: any
    }) {
        let {params, model} = options;
        let {fields, method} = params;
        let currentCompanyId = fields['companyId'];
        if (!currentCompanyId || typeof(currentCompanyId) == 'undefined') {
            let staff = await Staff.getCurrent();
            currentCompanyId = staff["companyId"];
        }

        let url = Config.openApiUrl + `/company/${currentCompanyId}/${model}`;
        let result: any;

        if (fields.hasOwnProperty("id")) {
            url = url + `/${fields['id']}`;
        }
        if (!fields.hasOwnProperty("id")) {
            if (method == 'get') {
                url = url + "?";
                for (let key in fields) {
                    url = url + `${key}=${fields[key]}&`;
                }
                if (url.lastIndexOf("&") == url.length - 1) {
                    url = url.slice(0, -1);
                }
            }
            url = encodeURI(url);
        }
        result = await request({
            uri: url,
            body: fields,
            json: true,
            method: method
        })
        if (typeof(result) == 'string') result = JSON.parse(result);
        return result;
    }
}


