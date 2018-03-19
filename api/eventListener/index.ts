/**
 * Created by wyl on 2017/10/30.
 */


'use strict';
var request = require("request-promise");
    
export class EventModule {
    async sendEventNotice(params: { url: string, body: object }): Promise<any> {
        const {url, body} = params
        try {
            let result = await request({  
                body,
                uri: url,
                method: 'POST',
                json: true
            });
            if (typeof (result) == 'string') {
                result = JSON.parse(result);
            }
            if (result && result.code == 0)
                return result.data;
            else
                return null;
        } catch (err) {
            throw err;
        }
    }
}

let eventModule = new EventModule();
export default eventModule;