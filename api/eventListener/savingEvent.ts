import L from '@jingli/language';
import { BaseEvent } from './baseEvent';
const _ = require('lodash');

export class SavingEvent extends BaseEvent {

    async emitTripSaving(params: { coins: number, orderNo: string, staffId: string,
        companyId: string, type: number, record: object }): Promise<any> {
        let { companyId } = params;
        if (!companyId) {
            throw L.ERR.INVALID_ARGUMENT("companyId");
        }

        const eventName = 'TRIP_SAVING'
        const eventListener = await super.findEventListener(eventName, companyId)

        console.log('eventListener=========', eventListener)

        if (!eventListener) return null

        let url = _.template(eventListener.url)(params)
        return await super.sendEventNotice({ url, body: { ...params, eventName } })
    }

}

export default new SavingEvent()