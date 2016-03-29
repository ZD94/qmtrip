/**
 * Created by wyl on 15-12-10.
 */
"use strict";
var assert = require("assert");
var API = require("common/api");

describe("api/client/qm_order.js", function() {

    var agencyId = "";
    var agencyUserId = "";
    var companyId = "";
    var staffId = "";
    var tripPlanId = "";
    var qmOrderId = "";

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
            budget: 1000,
            newInvoice: '票据详情'
        }]
    };

    var qmOrder = {
        date: '2016-04-07',
        order_no: '1234567890',
        out_order_no: '12345678900987654321',
        type: 'P'
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
            .then(function(tripPlan) {
                tripPlanId = tripPlan.id;
                qmOrder.trip_plan_id = tripPlanId;
                qmOrder.consume_id = tripPlan.outTraffic[0].id;
                qmOrder.staff_id = staffId;
                qmOrder.company_id = companyId;
                return API.qm_order.create_qm_order(qmOrder);
            })
            .then(function(order) {
                qmOrderId = order.id;
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
            API.staff.deleteAllStaffByTest({email: company.email}),
            API.tripPlan.deleteTripPlanOrder({orderId: tripPlanId, userId: staffId}),
            API.qm_order.delete_qm_order({order_id: qmOrderId, user_id: staffId})
        ])
            .spread(function(){
                done()
            })
            .catch(function(err){
                throw err;
            })
            .done();
    });


    it("#page_qm_orders should be ok", function(done) {
        var params = {
            page: "1",
            per_page: "20"
        };
        API.client.qm_order.page_qm_orders.call({accountId: staffId}, params, function(err, ret) {
            if(err) {
                throw err;
            }
            console.info(ret);
            done();
        });
    });


    it("#get_qm_order should be ok", function(done) {
        API.client.qm_order.get_qm_order.call({accountId: staffId}, {order_id: qmOrderId}, function(err, ret) {
            if(err) {
                throw err;
            }

            if(ret.toJSON) {
                console.info(ret.toJSON());
            }

            done();
        });
    });


    it("#get_orders_plan_id should be ok", function(done) {
        API.client.qm_order.get_orders_plan_id.call({accountId: staffId}, {trip_plan_id: tripPlanId}, function(err, ret) {
            if(err) {
                throw err;
            }

            if(ret.length > 0) {
                console.info(ret.map(function(c) {
                    return c.toJSON();
                }))
            }

            done();
        });
    });



});