/**
 * Created by wyl on 2017/10/26.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import API from '@jingli/dnode-api';
import {Models} from "_types";

@Restful()
export class EventsController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

    @Router('/registry-event-listener', "POST")
    async registryEventListener(req, res, next){
        let {events} = req.body;
        console.info(events);
        //do something
        res.json(this.reply(0, events));
    }

}

