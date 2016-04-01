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
    var consumeId = "";
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
        }]
    };

    var qmOrder = {
        trip_plan_id: tripPlanId,
        consume_id: consumeId,
        airways: 'MU',
        flight_no: 'MU5693',
        cabin_type: '0',
        date: '2016-04-07',
        start_city_code: 'BJ123',
        end_city_code: 'SH123',
        pay_price: '1200',
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
                consumeId = tripPlan.outTraffic[0].id
                qmOrder.trip_plan_id = tripPlanId;
                qmOrder.consume_id = consumeId;
                qmOrder.staff_id = staffId;
                qmOrder.company_id = companyId;
                return API.client.qm_order.create_order.call({accountId: staffId}, qmOrder);
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


    describe("create_qm_order", function() {
        var new_trip_plan_id = '';
        var new_consume_id = '';
        var new_qm_order_id = '';

        before(function(done) {
            API.client.tripPlan.savePlanOrder.call({accountId: staffId}, tripPlanOrder)
                .then(function(trip_plan) {
                    new_trip_plan_id = trip_plan.id;
                    new_consume_id = trip_plan.outTraffic[0].id;
                    done();
                })
                .catch(function(err) {
                    throw err;
                }).done();
        });

        after(function(done) {
            Promise.all([
                API.tripPlan.deleteTripPlanOrder({orderId: new_trip_plan_id, userId: staffId}),
                API.qm_order.delete_qm_order({order_id: new_qm_order_id, user_id: staffId})
            ])
                .spread(function(){
                    done()
                })
                .catch(function(err){
                    throw err;
                })
                .done();
        });

        it("create_qm_order should be ok", function(done) {
            var _qm_order = {
                trip_plan_id: new_trip_plan_id,
                consume_id: new_consume_id,
                flight_no: 'MU5693',
                start_city_code: 'BJA',
                end_city_code: 'SHA',
                airways: 'MU',
                pay_price: '100.00',
                cabin_type: '0',
                date: '2016-04-10'
            };

            API.client.qm_order.create_order.call({accountId: staffId}, _qm_order, function(err, ret) {
                if(err) {
                    throw err;
                }

                if(ret.toJSON) {
                    ret = ret.toJSON();
                }
                new_qm_order_id = ret.id;
                done();
            })
        });
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
            done();
        });
    });


    it("#get_qm_order should be ok", function(done) {
        API.client.qm_order.get_qm_order.call({accountId: staffId}, {order_id: qmOrderId}, function(err, ret) {
            if(err) {
                throw err;
            }

            if(ret.toJSON) {
                ret = ret.toJSON();
            }

            done();
        });
    });


    it("#get_orders_plan_id should be ok", function(done) {
        API.client.qm_order.get_orders_plan_id.call({accountId: staffId}, {trip_plan_id: tripPlanId}, function(err, ret) {
            if(err) {
                throw err;
            }

            //if(ret.length > 0) {
            //    console.info(ret.map(function(c) {
            //        return c.toJSON();
            //    }))
            //}

            done();
        });
    });



});