import { Models } from '_types';
import { EventListener } from "_types/eventListener";
import { EApproveChannel } from '_types/approve';
import L from '@jingli/language';
import { requireParams } from '@jingli/dnode-api/dist/src/helper';
import { BaseEvent } from './baseEvent';
const config = require("@jingli/config");
const _ = require('lodash');
const request = require('request-promise')

export class TripApproveEvent extends BaseEvent {

    async emitNewTripApprove(params: { data: any, companyId: string }): Promise<any> {
        let { companyId } = params;
        if (!companyId) {
            throw L.ERR.INVALID_ARGUMENT("companyId");
        }

        const eventName = 'NEW_TRIP_APPROVE'
        let eventListener = await super.findEventListener(eventName, companyId)

        if (!eventListener) {
            let company = await Models.company.get(companyId);
            if (company && (company.oa == EApproveChannel.QM || company.oa == EApproveChannel.DING_TALK)) {
                let approveServerUrl = config.approveServerUrl;
                approveServerUrl = approveServerUrl + `/tripApprove/receive`;
                eventListener = EventListener.create({
                    event: "NEW_TRIP_APPROVE",
                    url: approveServerUrl,
                    companyId
                });
                await eventListener.save();
            } else {
                return null
            }
        }
        let url = _.template(eventListener.url)(params.data)
        return await super.sendEventNotice({ url, body: { ...params, eventName } })
    }

    @requireParams(['modelName', 'methodName', 'data', 'companyId'])
    async sendRequestToApprove(params: { modelName: string, methodName: string, data: any, companyId: string }): Promise<any> {
        try {
            let company = await Models.company.get(params.companyId);
            if (!company) throw new L.ERROR_CODE_C(404, 'company is not found')
            let url = company.approveServerUrl ? company.approveServerUrl : config.approveServerUrl + `/tripApprove/receiveRequest`;

            let result = await request({
                uri: url,
                body: params,
                json: true,
                method: 'post'
            });
            if (typeof (result) == 'string') {
                result = JSON.parse(result);
            }
            if (result && result.code == 0)
                return result.data;
        } catch (err) {
            console.info(err);
            throw err;
        }
        return null
    }

}

export default new TripApproveEvent()