/**
 * Created by wyl on 15-12-10.
 */
"use strict";
var assert = require("assert");
var API = require("common/api");

describe("api/client/airplane.js", function() {

    var agencyId = "";
    var agencyUserId = "";
    var companyId = "";
    var staffId = "";
    var tripPlanId = '';
    var consumeId = '';
    var query_key = '201603301613047232';

    var agency = {
        email: "tripPlan.test@tulingdao.com",
        userName: "白菜帮九袋长老",
        name: '白菜帮',
        mobile: "15269866803",
        description: '计划单测试用代理商'
    };

    var company = {
        email: "tripPlan.test@tulingdao.com",
        userName: "白菜帮九袋长老",
        name: '白菜帮',
        mobile: "15269866803",
        domain: 'tulingdao.com',
        description: '计划单测试用企业'
    };

    var tripPlanOrder = {
        startPlace: '北京',
        destination: '上海',
        startPlaceCode: 'BJ123',
        destinationCode: 'SH123',
        description: '审核发票用测试',
        budget: 1000,
        startAt: '2016-04-07',
        consumeDetails: [{
            type: -1,
            startTime: '2016-04-07',
            endTime: '2016-04-30',
            startPlace: '北京',
            startPlaceCode: 'BJ123',
            arrivalPlace: '上海',
            arrivalPlaceCode: 'SH123',
            invoiceType: 'PLANE',
            budget: 1000
        }]
    };

    before(function(done){
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
            API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
            API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
        ])
            .spread(function(){
                return API.agency.registerAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function(company){
                companyId = company.id;
                staffId = company.createUser;
                return API.client.tripPlan.savePlanOrder.call({accountId: staffId}, tripPlanOrder);
            })
            .then(function(ret) {
                tripPlanId = ret.id;
                consumeId = ret.outTraffic[0].id;
                done();
            })
            .catch(function(err){
                console.error(err);
                throw err;
            })
            .done();
    })

    after(function(done) {
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email})
        ])
            .spread(function(){
                done()
            })
            .catch(function(err){
                throw err;
            })
            .done();
    });

    it("#get_plane_list should be ok", function(done) {
        this.timeout(20000);
        var params = {
            arrival_city: "SHA",
            date: "2016-04-10",
            departure_city: "PEK",
            ip_address: '192.168.1.3'
        };
        API.client.airplane.get_plane_list.call({accountId: staffId}, params, function(err, ret) {
            if(err) {
                throw err;
            }
            query_key = ret[0].query_key;
            done();
        });
    });


    it("#get_plane_details should be ok", function(done) {
        this.timeout(20000);
        var params = {
            flight_no: "MU5693",
            ip_address: '192.168.1.3',
            query_key: '201603301859437592'
        };
        API.client.airplane.get_plane_details.call({accountId: staffId}, params, function(err, ret) {
            if(err) {
                throw err;
            }
            done();
        });
    });

    it("#book_ticket should be ok", function(done) {
        this.timeout(20000);
        var params = {
            flight_list: {},
            trip_plan_id: tripPlanId,
            consume_id: consumeId,
            flight_no: 'HU7609',
            email: "",
            remark: "",
            contact_name: "于淼",
            contact_mobile: "18515073641",
            adult_num: 1,
            insurance_price: 20,
            insurance_type: "151009091743795523",
            ip_address: "192.168.1.4",
            passengers: [{
                name: "于淼",
                mobile_num: '18515073641',
                certificate_type: "NI",
                certificate_number: "130430199008110010",
                certificate_validity_date: "1807",
                passenger_type: 1,
                country: "中国",
                birthday: "1990-08-11",
                price: "100",
                air_tax: "50",
                tax: 0
            }]
        };

        API.client.airplane.book_ticket.call({accountId: staffId}, params, function(err, ret) {
            if(err) {
                throw err;
            }
            if(ret.toJSON) {
                ret = ret.toJSON();
            }
            done();
        });
    });

});