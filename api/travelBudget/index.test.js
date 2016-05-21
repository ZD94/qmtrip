/**
 * Created by wlh on 15/12/24.
 */

var assert = require("assert");
var moment = require("moment");
var API = require("common/api");

//var pg_promise = require('pg-promise');
//var pgp = pg_promise({ promiseLib: Q});
//var config = require("config");

var CITY = {
    BeiJing: "CT_131",
    ShangHai: "CT_289"
};

describe("api/client/travelBudget.js", function() {
    var agencyId = "";
    var agencyUserId = "";
    var companyId = "";
    var staffId = "";
    var travelPolicyId = "";
    var agency = {
        email: "travelBudget.test@tulingdao.com",
        userName: "喵喵",
        name: '喵喵的代理商',
        mobile: "15269866805",
        description: '差旅预算API测试用'
    };

    var company = {
        name: '喵喵的企业',
        userName: '喵喵',
        domain: 'tulingdao.com',
        description: '差旅预算API测试用',
        email: 'travelBudget.test@tulingdao.com',
        mobile: '15269866805'
    }

    var travelPolicy = {
        name: "四级标准",
        planeLevel: "经济舱" ,
        planeDiscount: "7.5",
        trainLevel: "硬卧",
        hotelLevel: "三星级",
        hotelPrice: "300",
    }

    before(function(done){
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email}),
            API.travelPolicy.deleteTravelPolicyByTest({name: travelPolicy.name})
        ])
            .spread(function(ret1, ret2, ret3, ret4){
                return API.agency.createAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function(company){
                companyId = company.id;
                staffId = company.createUser;
                travelPolicy.companyId = companyId;
                return API.travelPolicy.createTravelPolicy(travelPolicy);
            })
            .then(function(ret){
                travelPolicyId = ret.id;
                return API.staff.updateStaff({id: staffId, travelPolicyId: travelPolicyId});
            })
            .then(function(ret){
                assert.equal(ret.travelPolicyId, travelPolicyId);
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    })


    after(function(done) {
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email}),
            API.travelPolicy.deleteTravelPolicyByTest({name: travelPolicy.name})
        ])
            .spread(function(ret1, ret2, ret3, ret4){
                done()
            })
            .catch(function(err){
                throw err;
            })
            .done();
    });

    function handleError(err) {
        throw err;
    }

    var leaveDate = moment().add("1", "months").format("YYYY-MM-DD");
    var goBackDate = moment().add("1", "months").add("2", "days").format("YYYY-MM-DD");

    it("#getHotelBudget should be ok", function(done) {
        this.timeout(60 * 1000);
        API.client.travelBudget.getHotelBudget.call({accountId: staffId}, {cityId: "CT_131", checkInDate: leaveDate, checkOutDate: goBackDate})
            .then(function(result) {
            console.info("getHotelBudget result is ====>", result)
            var price = result.price ? true: false;
            assert.equal(price, true);
            done();
        })
        .catch(handleError)
    })

    it("#getTravelPolicyBudget should be ok", function(done) {
        this.timeout(60 * 1000);
        API.client.travelBudget.getTravelPolicyBudget.call({accountId: staffId}, {originPlace: "CT_131", destinationPlace: "CT_289",
            leaveDate: leaveDate, goBackDate: goBackDate}, function(err, result) {
            if (err) {
                throw err;
            }

            if (typeof result == 'string') {
                try{
                    result = JSON.parse(result);
                } catch(err) {
                    throw err;
                }
            }
            var traffic = result.traffic ? true: false;
            var hotel = result.hotel ? true : false;

            assert.equal(traffic, true);
            assert.equal(hotel, true);
            done();
        })
    });

    it("#getTravelPlicyBudget should be ok with isRoundTrip=true", function(done) {
        this.timeout(60 * 1000);
        API.client.travelBudget.getTravelPolicyBudget.call({accountId: staffId}, {originPlace: CITY.BeiJing, destinationPlace: CITY.ShangHai,
            leaveDate: leaveDate, goBackDate: goBackDate, isRoundTrip: true}, function(err, result) {
            if (err) {
                throw err;
            }

            if (typeof result == 'string') {
                try{
                    result = JSON.parse(result);
                } catch(err) {
                    throw err;
                }
            }
            var ret = result.price > 0 ?true: false;
            assert.equal(ret, true);
            done();
        })
    })

    it("#getTravelPolicyBudget should throw error without air information", function(done) {
        this.timeout(60 * 1000);
        API.client.travelBudget.getTravelPolicyBudget.call({accountId: staffId}, {originPlace: "abcd", destinationPlace: "CT_289", leaveDate: leaveDate, goBackDate: goBackDate}, function(err, result) {
            if (err) {
                done();
            }  else {
                throw new Error("not throw error");
            }
        });
    })


    it("#getTraiffic should be ok", function(done) {
        this.timeout(60 * 1000);
        API.client.travelBudget.getTrafficBudget.call({accountId: staffId}, {originPlace: "CT_131", destinationPlace: "CT_289",
            leaveDate: leaveDate, goBackDate: goBackDate}, function(err, result) {
            if (err) {
                throw err;
            }

            assert.equal(result.price ? true: false, true);
            done();
        })
    })

    it("#getTraiffic should be ok with originPlace=北京 destinationPlace=上海", function(done) {
        this.timeout(60 * 1000);
        API.client.travelBudget.getTrafficBudget.call({accountId: staffId}, {originPlace: "北京市", destinationPlace: "上海市",
            leaveDate: leaveDate, goBackDate: goBackDate}, function(err, result) {
            if (err) {
                throw err;
            }

            assert.equal(result.price ? true: false, true);
            done();
        })
    })

    it("#getTraiffic goTraffic should be object", function(done) {
        this.timeout(60 * 1000);
        API.client.travelBudget.getTrafficBudget.call({accountId: staffId}, {originPlace: "CT_131", destinationPlace: "CT_289",
            leaveDate: leaveDate, goBackDate: goBackDate}, function(err, result) {
            assert.equal(err, null);
            assert.equal(result.price ? true: false, true);
            assert.equal(typeof result.goTraffic == 'object', true);
            done();
        })
    })
});