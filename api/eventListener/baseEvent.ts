'use strict';

import { Models } from '_types';
import { EventListener } from '_types/eventListener'
const request = require("request-promise");

export class BaseEvent {
    private maxTryTimes = 5;
    private getDelay(count: number): number {
        let seconds: number = 0;
        switch(count) {
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

    async sendEventNotice(params: { url: string, body: object }, count = 1): Promise<any> {
        let self = this;
        const { url, body } = params
        console.log('send event to ', url)
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
            console.log('response is', result)
            if (result && result.code == 0) {
                return result.data;
            }
        } catch (err) {
            console.error('send event notify err:', err);
        }
        count++;
        if (count > self.maxTryTimes) {
            console.error('send event notify try ', self.maxTryTimes, 'but fail!');
            return;
        }

        setTimeout( () => {
            self.sendEventNotice(params, count);
        }, self.getDelay(count) * 1000);
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

const baseEvent = new BaseEvent()

export default baseEvent