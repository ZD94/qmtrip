/**
 * Created by yumiao on 16-03-23.
 */
'use strict';

var API = require("common/api");
var L = require("common/language");
var Logger = require('common/logger');
var _ = require('lodash');

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

    return API.staff.getStaff({id: self.accountId})
        .then(function() {
            return API.shengyi_ticket.search_ticket(params);
        })
        .then(function(ret) {
            logger.info(ret);
            return ret;
        })
};

/**
 * 获取舱位信息
 * @param params
 * @param   {string}    params.flight_no   航班号
 * @param   {string}    params.ip_address   ip地址
 * @returns {*}
 */
airplane.get_plane_details = get_plane_details;
get_plane_details.required_params = ['flight_no', 'ip_address'];
function get_plane_details(params) {
    var self = this;

    return API.staff.getStaff({id: self.accountId})
        .then(function() {
            return _flight;
            //return API.shengyi_ticket.search_more_cabin(params);
        })
};


airplane.book_ticket = book_ticket;
book_ticket.require_params = ['flight_no', 'trip_plan_id', 'consume_id'];
function book_ticket(params) {
    var self = this;
    return Promise.all([
        API.staff.getStaff({id: account_id, columns: ['companyId']}),
        API.shengyi_ticket.book_ticket(params),
        API.seeds.getSeedNo('tripPlanOrderNo')
    ])
        .then(function(staff, ret, order_no) {
            params.companyId = company_id;
            params.staffId = self.accountId;
            params.order_no = order_no;
            params.out_order_no = ret.order_no;

            return API.qm_order.page_qm_orders(params);
        })
}

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
        [{ air_con_fee: '50',
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
            remark: '签转、换开、改签均需收回代理费。改签需要回收代理费' },
            { air_con_fee: '50',
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
                remark: '签转、换开、改签均需收回代理费。改签需要回收代理费' }],
    flight_mod: '73E',
    stop_over: '1',
    supply_count: '0',
    min_buy_price: '0.0',
    max_buy_price: '0.0',
    depCityMc: '',
    arrCityMc: '',
    flight_rate: '0.93' }

module.exports = airplane;