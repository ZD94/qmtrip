import { EventModule } from ".";
import L from '@jingli/language';
const _ = require('lodash');

export class SavingEvent extends EventModule {

    async emitTripSaving(params: { data: any, companyId: string }): Promise<any> {
        let { companyId } = params;
        if (!companyId) {
            throw L.ERR.INVALID_ARGUMENT("companyId");
        }

        const eventName = 'TRIP_SAVING'
        const eventListener = await super.findEventListener(eventName, companyId)
        if (!eventListener) return null

        let url = _.template(eventListener.url)(params.data)
        super.sendEventNotice({ url, body: { ...params, eventName } })
    }

}

export default new SavingEvent()