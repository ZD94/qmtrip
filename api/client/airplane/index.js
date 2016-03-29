/**
 * Created by yumiao on 16-03-23.
 */
'use strict';

var API = require("common/api");
var L = require("common/language");
var Logger = require('common/logger');
var _ = require('lodash');
var moment = require('moment');
var getRndStr = require('common/utils').getRndStr;

var logger = new Logger('airplane');
var airplane = {};

/**
 * 查询机票列表接口
 * @param params
 * @param {integer} params.query_flag   查询类型 0：国际 1：国内
 * @param {integer} params.travel_type  1 单程,2 往返,3 联程,4 缺口
 * @param {string}  params.departure_city  出发城市代码
 * @param {string}  params.arrival_city    到达城市代码
 * @param {date}    params.date     出发时间
 * @param {date}    params.back_date   返回时间
 * @param {string}  params.ip_address   ip地址
 * @returns {Array} list
 */
airplane.get_plane_list = get_plane_list;
get_plane_list.required_params = ['departure_city', 'arrival_city', 'date', 'ip_address'];
get_plane_list.optional_params = ['query_flag', 'travel_type'];
function get_plane_list(params) {
    var self = this;
    var query_key = moment().format('YYYYMMDDHHmmss') + getRndStr(4, 1);

    return API.staff.getStaff({id: self.accountId})
        .then(function() {
            params.query_key = query_key;
            logger.info("********************");
            logger.info(params);
            return API.shengyi_ticket.search_ticket(params);
        })
        .then(function(ret) {
            return ret.map(function(flight) {
                flight.query_key = query_key;
                return flight;
            })
        })
};

/**
 * 获取舱位信息
 * @param   params
 * @param   {string}    params.flight_no   航班号
 * @param   {string}    params.ip_address   ip地址
 * @param   {string}    params.query_key    选择的航班的query_key
 * @returns {*}
 */
airplane.get_plane_details = get_plane_details;
get_plane_details.required_params = ['flight_no', 'ip_address', 'query_key'];
function get_plane_details(params) {
    var self = this;

    return API.staff.getStaff({id: self.accountId})
        .then(function() {
            //return _flight;
            return API.shengyi_ticket.search_more_cabin(params);
        })
};

/**
 * 预定机票API，并创建机票订单
 * @type {book_ticket}
 */
airplane.book_ticket = book_ticket;
book_ticket.required_params = ['flight_list', 'flight_no', 'trip_plan_id', 'consume_id', 'contact_name', 'contact_mobile', 'adult_num', 'ip_address', 'passengers'];
book_ticket.optional_params = ['insurance_price', 'insurance_type'];
function book_ticket(params) {
    var self = this;
    var account_id = self.accountId;

    params.flight_list = _flight_list;
    return API.tripPlan.getConsumeDetail({consumeId: params.consume_id})
        .then(function(consume) {
            if(consume.orderStatus !== 'WAIT_UPLOAD') {
                throw {code: -2, msg: '预定失败，请检查出差记录状态'};
            }

            return [consume, API.shengyi_ticket.book_ticket_test(params)];
        })
        .spread(function(consume, ret) {
            return Promise.all([
                consume,
                API.staff.getStaff({id: account_id, columns: ['companyId']}),
                API.seeds.getSeedNo('tripPlanOrderNo'),
                API.shengyi_ticket.get_ticket_order({order_no: ret.order_no})
            ])
        })
        .spread(function(consume, staff, order_no, ticket_order) {
            console.info("**************************");
            console.info(consume.orderStatus);
            console.info(ticket_order);
            console.info(ticket_order.passengers[0]);
            params.company_id = staff.companyId;
            params.staff_id = account_id;
            params.order_no = order_no;
            params.out_order_no = ticket_order.order_no;
            params.flight_no = ticket_order.flight_no;
            params.type = 'P';

            console.info("***********************");
            //1603291528210000481
            //KSLWJM
            return API.qm_order.create_qm_order(params);
        })
};


var _flight = { departure_date: '2016-04-10',
    departure_city_code: 'PEK',
    arrival_city_code: 'SHA',
    departure_time: '07:55',
    arrival_time: '12:45',
    flight_no: 'MU5693',
    fly_time: '4:50',
    air_con_fee: '50',
    fuel_tax: '0',
    meal: '',
    departure_term: 'T2',
    arrival_term: 'T2',
    stand_price: '1240',
    cabins:
        [{
            air_con_fee: '50',
            bill_price: '740',
            buy_price: '724.46',
            insurance_num: '0',
            insurance_type: '151009091743795523',
            cabin: 'R',
            cabin_type: '0',
            cabin_level: '0',
            cabin_name: '经济舱',
            discount: '60.0',
            fuel_tax: '0',
            market_price: '0.0',
            note: '退票规定：航班规定离站时间2小时前(含):30%,航班规定离站时间2小时内(不含)及飞后:50%。变更规定：航班规定离站时间2小时前(含):20%,航班规定离站时间2小时内(不含)及飞后:30%。签转规定：不允许自愿签转.温馨提示：仅供参考，最终以航司规定为准！',
            pay_price: '0.0',
            policy_id: 'CPS_PTZCdgyy_9f8447a9-abd4-4149-a1d5-4cac47ed8e48',
            policy_name: '普通',
            policy_type: 'CPS_PTZC',
            platform: '3',
            remain_seat_num: '',
            sale_price: '740.0',
            seat_num: 'A',
            suggest_price: '740.0',
            tgq_type: '',
            refund_policy: '退票30%-50%',
            ticket_supply: {},
            ticket_type: 'BPET',
            total_seat_num: '',
            remark: '签转、换开、改签均需收回代理费。改签需要回收代理费' }, {
            air_con_fee: '50',
            bill_price: '740',
            buy_price: '724.46',
            insurance_num: '0',
            insurance_type: '151009091743795523',
            cabin: 'R',
            cabin_type: '0',
            cabin_level: '0',
            cabin_name: '经济舱',
            discount: '60.0',
            fuel_tax: '0',
            market_price: '0.0',
            note: '退票规定：航班规定离站时间2小时前(含):30%,航班规定离站时间2小时内(不含)及飞后:50%。变更规定：航班规定离站时间2小时前(含):20%,航班规定离站时间2小时内(不含)及飞后:30%。签转规定：不允许自愿签转.温馨提示：仅供参考，最终以航司规定为准！',
            pay_price: '0.0',
            policy_id: 'CPS_PTZCdgyy_9f8447a9-abd4-4149-a1d5-4cac47ed8e48',
            policy_name: '普通',
            policy_type: 'CPS_PTZC',
            platform: '3',
            remain_seat_num: '',
            sale_price: '740.0',
            seat_num: 'A',
            suggest_price: '740.0',
            tgq_type: '',
            refund_policy: '退票30%-50%',
            ticket_supply: {},
            ticket_type: 'BPET',
            total_seat_num: '',
            remark: '签转、换开、改签均需收回代理费。改签需要回收代理费'
        }],
    flight_mod: '73E',
    stop_over: '1',
    supply_count: '0',
    min_buy_price: '0.0',
    max_buy_price: '0.0',
    depCityMc: '',
    arrCityMc: '',
    flight_rate: '0.93' }

var _flight_list = {
    airways: 'MU',
    departure_date: '2016-04-10',
    departure_city_code: 'PEK',
    arrival_city_code: 'SHA',
    departure_time: '07:55',
    arrival_time: '12:45',
    flight_no: 'MU5693',
    fly_time: '4:50',
    air_con_fee: '50',
    fuel_tax: '0',
    meal: 'L',
    departure_term: 'T2',
    arrival_term: 'T2',
    stand_price: '1240',
    flight_mod: '73E',
    stop_over: '1',
    supply_count: '0',
    min_buy_price: '0.0',
    max_buy_price: '0.0',
    punctual_rate: '0.93',
    query_key: '201603291216324386',
    cabin: {
        air_con_fee: '50',
        bill_price: '860',
        buy_price: '840.22',
        insurance_num: '0',
        insurance_type: '151009091743795523',
        cabin: 'N',
        cabin_type: '0',
        cabin_level: '0',
        cabin_name: '经济舱',
        discount: '69.0',
        fuel_tax: '0',
        market_price: '0.0',
        note: '退票规定：航班规定离站时间2小时前(含):30%,航班规定离站时间2小时内(不含)及飞后:50%。变更规定：航班规定离站时间2小时前(含):20%,航班规定离站时间2小时内(不含)及飞后:30%。签转规定：不允许自愿签转.温馨提示：仅供参考，最终以航司规定为准！',
        pay_price: '0.0',
        policy_id: 'CPS_PTZCdgyy_485da64e-b1ae-4907-bd1b-a0796232556a',
        policy_name: '普通',
        policy_type: 'CPS_PTZC',
        platform: '3',
        remain_seat_num: '',
        sale_price: '860.0',
        seat_num: 'A',
        suggest_price: '860.0',
        tgq_type: '',
        refund_policy: '退票30%-50%',
        ticket_supply: [Object],
        ticket_type: 'BPET',
        total_seat_num: '',
        remark: '签转、换开、改签均需收回代理费。改签需要回收代理费' },
};

//this.fuelTax = options.fuel_tax;
//this.meal = options.meal;
//this.depTerm = options.departure_term;
//this.arrTerm = options.arrival_term;
//this.standPrice = options.stand_price;
//this.flightMod = options.flight_mod;
//this.stopOver = options.stop_over;
//this.supplyCount = options.supply_count;
//this.minBuyPrice = options.min_buy_price;
//this.maxBuyPrice = options.max_buy_price;
////this.carrFlightNo = options.carrFlightNo;
//this.airways = options.airways;
module.exports = airplane;