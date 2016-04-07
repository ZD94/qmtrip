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
        startPlace: '上海',
        destination: '哈尔滨',
        startPlaceCode: "CT_289",
        destinationCode: "CT_048",
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

    var _flight_list = {
        airways: 'MU',
        departure_date: '2016-05-10',
        dept_station_code: 'PVG',
        arrival_station_code: 'HRB',
        departure_time: '2016-05-10 14:10:00',
        arrival_time: '2016-05-10 18:45:00',
        flight_no: 'MU5611',
        fly_time: '4:35',
        air_con_fee: 50,
        fuel_tax: 0,
        meal: 'D',
        meal_name: '正餐',
        departure_term: 'T1',
        arrival_term: '',
        stand_price: 1810,
        flight_mod: '325',
        stop_over: '1',
        supply_count: '0',
        buy_price: 709.92,
        bill_price: 720,
        suggest_price: 770,
        discount: 40,
        cabin: {
            air_con_fee: 50,
            bill_price: 4160,
            buy_price: 4091.78,
            insurance_num: 0,
            insurance_type: '151009091743795523',
            cabin: 'F',
            cabin_type: 'F',
            cabin_level: '6',
            cabin_name: '头等舱',
            discount: 230,
            fuel_tax: 0,
            market_price: 0,
            note: '退票规定：航班规定离站时间2小时前(含):免费退票,航班规定离站时间2小时内(不含)及飞后:F舱的10%。变更规定：航班规定离站时间2小时前(含):免费变更,航班规定离站时间2小时内(不含)及飞后:F舱的5%。签转规定：允许自愿签转.温馨提示：仅供参考，最终以航司规定为准！',
            pay_price: 0,
            policy_id: 'CPS_PTZCdgyy_6b56f79c-10a3-44b9-a8b7-7e526a4dbc91',
            policy_name: '普通',
            policy_type: 'CPS_PTZC',
            platform: '3',
            remain_seat_num: '',
            sale_price: 4160.0,
            seat_num: 'A',
            suggest_price: 4210.0,
            tgq_type: '',
            refund_policy: '退票0%-10%',
            ticket_type: 'BPET',
            total_seat_num: '',
            remark: '签转、换开、改签均需收回代理费。改签需要回收代理费',
            insurance_info: {
                settlement_price: '20',
                insurance_name: '泰康-1天80万-航意险C款',
                description: '1.保险名称：泰康一路畅行C航空意外保险；\n2.份数限制：限购2份，多投无效；\n3.投保年龄：0~80周岁；\n4.保险有效期：默认航班起飞前5分钟生效，1天有效；\n5.保险费：20元/份；\n6.保险金：飞机意外伤害80万；飞机意外烧伤10万；\n7.退保原则：保险生效前可在线退保，生效后不得退保；\n8.需要报销的客户可从代理服务商处获得由保险公司提供的保险定额发票以作报销。保险定额发票仅作为报销凭证，不是保单凭证；\n9.数据电文是合法的合同表现形式，电子保单与纸质保单具有同等法律效力，请妥善保存。电子保单可在保险公司官方网站上查询和下载；\n10.该保险详细条款可登录泰康官方网站查询：www.taikang.com。',
                type: '151009091743795523',
                overdrawn: '800000' }
        }
    }

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
            departure_city: "CT_289",
            arrival_city: "CT_048",
            date: "2016-05-10",
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
            flight_no: "MU5611",
            ip_address: '192.168.1.3',
            query_key: '20160407121028BWWWPVGHRB'
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
            flight_list: _flight_list,
            trip_plan_id: tripPlanId,
            consume_id: consumeId,
            contact_name: "于淼",
            contact_mobile: "18515073641",
            cabin: 'B',
            adult_num: 1,
            insurance_price: 20,
            pay_price: 1100,
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