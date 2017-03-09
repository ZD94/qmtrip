/**
 * Created by wlh on 2017/2/21.
 */

'use strict';

import TransitWaitDurationPrefer = require('../prefer/ticket-transitWaitDurationPrefer');
import {IFinalTicket} from "api/_types/travelbudget";
const tickets: Array<IFinalTicket> = require('./test-transit-tickets.json');

describe('ticket-transitWaitDurationPrefer', function() {

    it("#markScore() should be ok", function(done) {
        let options = {
            baseScore: 500,
            subScore: 5,
            maxDuration: 360,
            minDuration: 120,
        };
        let name = '中转等待时长';
        var prefer = new TransitWaitDurationPrefer(name, options);
        let result = prefer.markScore(tickets);
        done();
    })
})