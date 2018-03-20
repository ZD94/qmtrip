'use strict';

import { clientExport, requireParams } from '@jingli/dnode-api/dist/src/helper';
import TripApproveEvent from './tripApproveEvent';

export class EventModule {

    @clientExport
    @requireParams(['modelName', 'methodName', 'data', 'companyId'])
    static async sendRequestToApprove(params: { modelName: string, methodName: string, data: any, companyId: string }) {
        return await TripApproveEvent.sendRequestToApprove(params)
    }

}

export default new EventModule();
