import { EventModule } from ".";
import { Models } from '_types';
import L from '@jingli/language';
const _ = require('lodash');

export class SavingEvent extends EventModule {

    async emitTripSaving(params: { data: any, companyId: string }): Promise<any> {
        let { companyId } = params;
        if (!companyId) {
            throw L.ERR.INVALID_ARGUMENT("companyId");
        }

        const eventName = 'TRIP_SAVING'
        const eventListeners = await Models.eventListener.find({
            where: { event: eventName, companyId }
        })

        if (!eventListeners || !eventListeners.length) return null

        let url = _.template(eventListeners[0].url)(params.data)
        super.sendEventNotice({ url, body: { ...params, eventName } })
    }

}

export default new SavingEvent()