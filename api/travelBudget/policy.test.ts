/**
 * Created by wlh on 16/8/11.
 */

'use strict';

import assert = require("assert");
import cabin = require("./prefer/ticket-cabin");
import arrivaltime = require('./prefer/ticket-arrivaltime');
import departtime = require('./prefer/ticket-departtime');
import cheapsupplier = require('./prefer/ticket-cheapsupplier');
import maxpricelimit = require('./prefer/ticket-maxpricelimit');
import lowestprice = require('./prefer/ticket-lowestprice');
import {IFinalTicket} from "./_interface";
import {TRAFFIC} from "./_const";



describe("api/travelbudget/policy", function() {
    let testData = [
        {
            No: 'A1234',
            agent: "携程",
            price: 1200,
            cabin: 'Economy',
            originPlace: 'CT_131',
            destination: 'CT_289',
            duration: 120,
            departDateTime: "2016-08-11 12:00",
            arrivalDateTime: "2016-08-11 16:00",
            type: TRAFFIC.FLIGHT
        } as IFinalTicket
    ] as IFinalTicket[]

    it("#cabin should be ok", function() {
        let _testData = cloneData(testData);
        let data = cabin(_testData, 'Economy', 100);
        assert.equal(data[0]['score'], 100);
    })

    it("#arrivaltime should be ok", function() {
        let _testData = cloneData(testData);
        let data = arrivaltime(_testData, "2016-08-11 15:00", "2016-08-11 17:00", 100);
        assert.equal(data[0]['score'], 0);
    })
    
    it("#arrivaltime should be ok early d1", function() {
        let _testData = cloneData(testData);
        let data = arrivaltime(_testData, "2016-08-11 17:00", null, 100);
        assert.equal(data[0]['score'], -100);
    });

    it("#arrivaltime should be ok later d2", function() {
        let _testData = cloneData(testData);
        let data = arrivaltime(_testData, null, "2016-08-11 15:00", 100);
        assert.equal(data[0]['score'], -100)
    });

    it("#departtime should be ok", function() {
        let _testData = cloneData(testData);
        let data = departtime(_testData, "2016-08-11 11:00", "2016-08-11 13:00", 100);
        assert.equal(data[0]['score'], 0);
    })

    it("#departtime should be ok early d1", function() {
        let _testData = cloneData(testData);
        let data = departtime(_testData, "2016-08-11 15:00", null, 100);
        assert.equal(data[0]['score'], -100);
    });

    it("#departtime should be ok later d2", function() {
        let _testData = cloneData(testData);
        let data = departtime(_testData, null, "2016-08-11 11:00", 100);
        assert.equal(data[0]['score'], -100)
    });

    it("#maxpricelimit should be ok more than maxPrice ", function() {
        let _testData = cloneData(testData);
        let data = maxpricelimit(_testData, 1100, 50);
        assert.equal(data[0]['score'], -50);
    })

    it("#maxpricelimit should be ok less maxPrice", function() {
        let _testData = cloneData(testData);
        let data = maxpricelimit(_testData, 1300, 50);
        assert.equal(data[0]['score'], 0);
    })

    it("#cheapsupplier should be ok", function() {
        let _testData = cloneData(testData);
        let _cheapsupplies = ['携程', '途牛'];
        let data = cheapsupplier(_testData, _cheapsupplies, 100);
        assert.equal(data[0]['score'], -100);
    });

    it("#cheapsupplier should be ok", function() {
        let _testData = cloneData(testData);
        let _cheapsupplies = [];
        let data = cheapsupplier(_testData, _cheapsupplies, 50);
        assert.equal(data[0]['score'], 0);
    })

    it("#lowestprice should be ok", function() {
        let _testData = cloneData(testData);
        let data = lowestprice(_testData, 50);
        assert.equal(data[0]['score'], 50);
    })
});

function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
}