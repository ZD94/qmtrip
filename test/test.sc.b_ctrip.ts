'use strict';
import { RequestResponse } from 'request';
var requestPromise = require('request-promise');
var request = require('request');


var res = request.post({
    json: true,
    uri: "http://ct.ctrip.com/m/City/SearchCities",
    form: {
        key: "厦门",
        site: 3,
    },
    headers: {
        'Referer': 'http://ct.ctrip.com',
    },
}, function (err: any, httpResponse: any, body: any) {
    if (err) return;
    console.log(body.Response.city[0]);
    var cityObj = body.Response.city[0];
    var cityStr = cityObj.city;
    var trainCityCode = cityStr.split(",")[1].split("|")[0];
    console.log(trainCityCode);
})