'use strict';

import { Models } from '_types';
import { EventListener } from '_types/eventListener'
import L from '@jingli/language';
const request = require("request-promise");

export class BaseEvent {
    private getDelay(count: number): number {
        let seconds: number = 0;
        switch (count) {
            case 1:
                seconds = 0;
                break;
            case 2:
                seconds = 20;
                break;
            case 3:
                seconds = 60;
                break;
            case 4:
                seconds = 2 * 60;
                break;
            default:
                seconds = 5 * 60;
                break;
        }
        return seconds;
    }

    async sendEventNotice(params: { url: string, body: object }, count = 1, maxTimes = 1, isRet = true): Promise<any> {
        const { url, body } = params
        console.log('send event to ', url)
        count++;
        let result = await request({
            body,
            uri: url,
            method: 'POST',
            json: true,
        });
        if (typeof (result) == 'string') {
            result = JSON.parse(result);
        }
        console.log('response is', result)
        if (result && result.code == 0 || result.code == 200) {
            return result.data;
        }

        let err = new L.ERROR_CODE_C(result.code, result.msg);
        let self = this;
        let ret = new Promise((resolve, reject) => {
            if (count > maxTimes) {
                console.error('send event notify had try ', maxTimes, 'but still failed!');
                return reject(err);
            }

            let delay = self.getDelay(count) * 1000
            setTimeout(() => {
                return resolve(self.sendEventNotice(params, count));
            }, delay);
        });
        if (isRet) return ret
        ret.catch((err) => {
            console.error("sendEventNotice==>", err);
        })
    }

    async findEventListener(event: string, companyId: string): Promise<EventListener | null> {
        const eventListeners = await Models.eventListener.find({
            where: { event, companyId }
        })

        if (!eventListeners || !eventListeners.length) return null

        const result = eventListeners[0]
        if (result.startDate > new Date() || result.endDate < new Date()) return null

        return result
    }

}

export default new BaseEvent()