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
    var qmOrderNo = '';
    var _flight_list = {
        punctual_rate: '0.93',
        airways: 'MU',
        departure_date: '2016-04-10',
        dept_station_code: 'PEK',
        arrival_station_code: 'SHA',
        departure_time: '07:55',
        arrival_time: '12:45',
        flight_no: 'MU5693',
        fly_time: '4:50',
        air_con_fee: '50',
        fuel_tax: '0',
        meal: 'L',
        meal_name: '午餐',
        departure_term: 'T2',
        arrival_term: 'T2',
        stand_price: '1240',
        flight_mod: '73E',
        stop_over: '1',
        supply_count: '0',
        buy_price: '720.76',
        bill_price: '740',
        suggest_price: '790.0',
        discount: '60.0',
        ip_address: "192.168.1.4",
        cabin: {
            air_con_fee: '50',
            bill_price: '1230',
            buy_price: '1199.25',
            insurance_num: '0',
            insurance_type: '151009091743795523',
            cabin: 'B',
            cabin_type: '0',
            cabin_level: '0',
            cabin_name: '经济舱',
            discount: '99.0',
            fuel_tax: '0',
            market_price: '0.0',
            pay_price: '1100.0',
            policy_id: 'CPS_PTZCdgyy_80e691a5-db77-4a4a-ac2a-a61468092b9b',
            policy_name: '普通',
            policy_type: 'CPS_PTZC',
            platform: '3',
            remain_seat_num: '',
            sale_price: '1230.0',
            seat_num: 'A',
            suggest_price: '1230.0',
            tgq_type: '',
            refund_policy: '退票5%-10%',
            ticket_type: 'BPET',
            total_seat_num: '',
            remark: '签转、换开、改签均需收回代理费。改签需要回收代理费' },
    };

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
        flight_list: _flight_list,
        trip_plan_id: tripPlanId,
        consume_id: consumeId,
        airways: 'MU',
        flight_no: 'MU5693',
        cabin_type: '0',
        date: '2016-04-07',
        start_city_code: 'BJ123',
        end_city_code: 'SH123',
        pay_price: '1200',
        type: 'P',
        contact_name: '喵喵',
        contact_mobile: '18515073641',
        adult_num: 1,
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
                return API.client.airplane.book_ticket.call({accountId: staffId}, qmOrder);
            })
            .then(function(order) {
                qmOrderId = order.id;
                qmOrderNo = order.order_no;
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

    it("#book_and_pay_ticket should be ok", function(done) {
        API.qm_order.book_and_pay_ticket({order_no: qmOrderNo}, function(err, ret) {
            if(err) {
                throw err;
            }

            done();
        });
    });

});