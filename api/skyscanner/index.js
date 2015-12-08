'use strict';

var requestp = require('common/requestp');

var Session = require('./session');

var skyscanner = {};

skyscanner.Session = Session;

skyscanner.create_session = function(from, to, outdate, backdate) {
    return requestp.post({
        url: 'http://partners.api.skyscanner.net/apiservices/pricing/v1.0',
        headers: {'Accept': 'application/json'},
        form: {
            apiKey: 'prtl6749387986743898559646983194',
            country: 'CN',
            currency: 'CNY',
            locale: 'zh_CN',
            originplace: from,
            destinationplace: to,
            outbounddate: outdate,
            inbounddate: backdate,
            locationschema: 'Iata',
            cabinclass: 'Economy',
            adults: 1,
            children: 0,
            infants: 0,
            groupPricing: false
        }
    }).then(function(res){
        if (res.statusCode != 201) {
            throw {code: res.statusCode, msg: res.statusMessage};
        }
        console.log(res.headers);
        return res.headers.location;
    })
};

skyscanner.pull_session = function(url){
    return requestp
        .get({
            url: url,
            headers: {'Accept': 'application/json'},
            qs: {
                apiKey: 'prtl6749387986743898559646983194',
                stops: 0
            },
            gzip: true
        })
        .then(function (res) {
            console.error(res.headers);
            if ((res.statusCode < 200 || 300 <= res.statusCode) && 304 != res.statusCode) {
                throw {code: res.statusCode, msg: res.statusMessage};
            }
            if(res.statusCode != 304) {
                res.data = JSON.parse(res.body);
                res.data.__proto__ = Session.prototype;
                res.data.prepare();
            }else{
                res.data = {Status:'UpdatesPending'};
            }

            return res;
        });
};

module.exports = skyscanner;

