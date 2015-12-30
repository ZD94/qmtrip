/**
 * Created by wyl on 15-12-12.
 */
var assert = require("assert");
var company = require("./index");
var companyId = '6cf36000-aa21-11e5-a377-2fe1a7dbc5e1';
var accountId = "6cee7e00-aa21-11e5-a377-2fe1a7dbc5e1";
var self = {accountId: accountId};
var orderId = '';

describe("api/client/company.js", function() {

    describe("getCompanyListByAgency", function() {
        it("#getCompanyListByAgency should be ok", function(done) {
            company.getCompanyListByAgency.call(self, function(err, ret){
                if (err) {
                    throw err;
                }
                done();
            })
        });
    });

})