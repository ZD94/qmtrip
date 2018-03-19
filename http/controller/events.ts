/**
 * Created by wyl on 2017/10/26.
 */

'use strict';
import { AbstractController, Restful, Router } from "@jingli/restful";
import { Request, Response, NextFunction } from 'express';
import { EventListener } from "_types/eventListener";
import { Models } from '_types';

@Restful()
export class EventsController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    @Router('/registry-event-listener', "POST")
    async registryEventListener(req: Request, res: Response, next: NextFunction) {
        try {
            let { event, url, companyId } = req.body;
            const eventListeners = await Models.eventListener.find({
                where: { event, companyId }
            })
            if (eventListeners && eventListeners.length) {
                res.json(this.reply(0, eventListeners[0]))
                return
            }
            let eventListener = EventListener.create({ event, url, companyId, expires: '' });
            eventListener = await eventListener.save();

            res.json(this.reply(0, eventListener));
        } catch (e) {
            res.json(this.reply(500, e));
        }
    }


}

