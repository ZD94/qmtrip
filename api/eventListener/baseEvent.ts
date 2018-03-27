import { Models } from '_types';
import { EventListener } from '_types/eventListener'

'use strict';
var request = require("request-promise");

export class BaseEvent {
    async sendEventNotice(params: { url: string, body: object }): Promise<any> {
        const { url, body } = params
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
            console.log('err: ', err)
            // throw err;
            return this.sendEventNotice(params)
        }
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