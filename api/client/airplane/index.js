/**
 * Created by yumiao on 16-03-23.
 */
'use strict';

var API = require("common/api");
var L = require("@jingli/language");
var Logger = require('common/logger');
var _ = require('lodash');
var moment = require('moment');
var getRndStr = require('common/utils').getRndStr;
var logger = new Logger('airplane');
var cache = require("common/cache");

var MAILING_PRICE = 15;
var ERROR = {
    FLIGHT_EXPIRED: {code: 100, msg: '机票信息已经失效,请刷新后重试!'},
    TRIP_PLAN_STATUS_ERROR: {code: 101, msg: '预定失败，请检查出差记录状态'}
}

/****************************** test data ******************************/
var ip1 = ['192', '112', '114', '114'];
var ip2 = ['168', '222', '21', '11'];
var ip3 = ['123', '32', '12', '45'];
var ip4 = ['133', '43', '55', '66'];
function getRand(max) {
    return parseInt(Math.random() * max);
}
/****************************** test data ******************************/

/**
 * @class   airplane    机票相关API
 */
var airplane = {};

/**
 * @method get_plane_list
 *
 * 查询机票列表接口
 * @param params
 * @param {integer} params.query_flag   查询类型 0：国际 1：国内
 * @param {string}  params.dept_city  出发城市代码
 * @param {string}  params.arrival_city    到达城市代码
 * @param {date}    params.date    出发时间
 * @param {string}  params.dept_station   出发机场 数组，可以传多个
 * @returns {Array} list
 */

airplane.get_plane_list = get_plane_list;
get_plane_list.required_params = ['dept_city', 'arrival_city', 'date'];
get_plane_list.optional_params = ['query_flag', 'airways', 'dept_station', 'arrival_station', 'order'];
function get_plane_list(params) {
    var self = this;
    var query_key = moment().format('YYYYMMDDHHmmss') + getRndStr(4, 2);

    params.ip_address = ip1[getRand(4)] + '.' + ip2[getRand(4)] + '.' +  ip3[getRand(4)] + '.' +  ip4[getRand(4)];
    //params.ip_address = self.remoteAddress;

    return Promise.all([
        API.staff.getStaff({id: self.accountId}),
        API.place.getAirPortsByCity({cityCode: params.dept_city}),
        API.place.getAirPortsByCity({cityCode: params.arrival_city})
    ])
        .spread(function(staff, s_stations, e_stations) {
            var query_params = [];
            s_stations.map(function(s1) {
                var dept_station = params.dept_station;
                if(dept_station && dept_station.indexOf(s1.id) < 0) {
                    return;
                }

                var query_1 = {start_station: s1.skyCode};
                e_stations.map(function(s2) {
                    var arrival_station = params.arrival_station;
                    if(arrival_station && arrival_station.indexof(s2.id) < 0) {
                        return;
                    }

                    query_1.arrival_station = s2.skyCode;
                    query_params.push({start_station: query_1.start_station, arrival_station: query_1.arrival_station});
                });
            });

            return Promise.all(query_params.map(function(q) {
                params.query_key = query_key + q.start_station + q.arrival_station;
                params.departure_station = q.start_station;
                params.arrival_station = q.arrival_station;
                // return API.shengyi_ticket.search_ticket(params);
            }))
        })
        .then(function(result) {
            var flight_list = [];
            result.map(function(ret) {
                ret.map(function(flight) {
                    flight.dept_city = params.dept_city;
                    flight.arrival_city = params.arrival_city;
                    flight_list.push(flight);
                })
            });

            if(flight_list.length > 1) {
                flight_list = _.uniqBy(flight_list, 'flight_no');
            }

            flight_list.map(function(flight) {
                console.info(flight.flight_no, flight.suggest_price, flight.departure_time, flight.query_key);
            });

            logger.info(flight_list);
            return flight_list;
        })

};

/**
 * @method  get_plane_details
 * 获取航班舱位信息
 * @param   params
 * @param   {string}    params.flight_no   航班号
 * @param   {string}    params.query_key    选择的航班的query_key
 * @returns {*}
 */
airplane.get_plane_details = get_plane_details;
get_plane_details.required_params = ['flight_no', 'query_key'];
function get_plane_details(params) {
    var self = this;
    params.ip_address = ip1[getRand(4)] + '.' + ip2[getRand(4)] + '.' +  ip3[getRand(4)] + '.' +  ip4[getRand(4)];
    //params.ip_address = self.remoteAddress;
    return API.staff.getStaff({id: self.accountId})
        .then(function() {
            // return API.shengyi_ticket.search_more_cabin(params);
        })
        .then(function(flight) {
            return [
                flight,
                API.place.getAirportBySkyCode({skyCode: flight.dept_station_code}),
                API.place.getAirportBySkyCode({skyCode: flight.arrival_station_code}),
                Promise.all(flight.cabins.map(function(cabin) {
                    cabin.cabin_id = 'cabin_' + new Date().valueOf() + getRndStr(4);
                    console.info(cabin.cabin_id, cabin.cabin, cabin.cabin_type, cabin.cabin_level, cabin.cabin_name, cabin.suggest_price);
                    return cache.write(cabin.cabin_id, cabin, 1800);
                }))
            ];
        })
        .spread(function(flight, dept_airport, arrival_airport, cabins) {
            flight.dept_city = dept_airport.cityId;
            flight.arrival_city = arrival_airport.cityId;
            flight.dept_station_code = dept_airport.id;
            flight.arrival_station_code = arrival_airport.id;
            flight.cabins = cabins;

            return [flight, cache.write(flight.flight_no, flight, 1800)]
        })
        .spread(function(flight) {
            return flight;
        })
        .catch(function(err) {
            logger.error(err.stack || err);
            throw err;
        })
};

/**
 * @method  book_ticket
 * 预定机票API，并创建机票订单
 * @param   {json}  params.flight_no  航班舱位集合
 * @param   {string}    params.cabin_id    舱位
 * @param   {string}    params.pay_price    需要支付的金额
 * @param   {uuid}  params.trip_plan_id     出差记录id
 * @param   {uuid}  params.consume_id       出行记录id
 * @param   {string}  params.contact_name     联系人姓名
 * @param   {string}  params.contact_mobile   联系人电话
 * @param   {string}  params.adult_num        成人数量，默认1
 * @param   {array}  params.passengers       乘客集合
 * @param   {boolean}  params.is_need_invoice     是否需要发票，默认false
 * @param   {uuid}  params.mailing_id     邮寄地址id
 * @type {book_ticket}
 */
airplane.book_ticket = book_ticket;
book_ticket.required_params = ['flight_no', 'cabin_id', 'trip_plan_id', 'consume_id',
    'contact_name', 'contact_mobile', 'adult_num', 'passengers'];
book_ticket.optional_params = ['is_need_invoice', 'mailing_id'];
function book_ticket(params) {
    var self = this;
    params.ip_address = params.remoteAddress;
    var account_id = self.accountId;
    var consume_id = params.consume_id;
    var flight_no = params.flight_no;
    var cabin_id = params.cabin_id;

    return Promise.all([
        API.tripPlan.getTripDetail({consumeId: params.consume_id}),
        cache.read(flight_no),
        cache.read(cabin_id)
    ])
        .spread(function(consume, flight_list, cabin) {
            if(consume.orderStatus !== 'WAIT_BOOK') {
                throw ERROR.TRIP_PLAN_STATUS_ERROR;
            }

            if(!flight_list || !cabin) {
                throw ERROR.FLIGHT_EXPIRED;
            }

            if(flight_list.cabins) {
                delete flight_list.cabins;
            }

            flight_list.cabin = cabin;
            console.info(flight_list);
            params.start_city_code = flight_list.dept_city_code;
            params.end_city_code = flight_list.arrival_city_code;
            params.flight_list = flight_list;
            params.airways = flight_list.airways;
            params.punctual_rate = flight_list.punctual_rate;
            params.start_time = flight_list.departure_time;
            params.end_time = flight_list.arrival_time;
            params.pay_price = cabin.suggest_price;
            params.cabin_type = cabin.cabin_type;
            params.cabin_name = cabin.cabin_name;
            params.cabin_no = cabin.cabin;

            return [
                consume,
                API.staff.getStaff({id: account_id, columns: ['companyId']}),
                API.seeds.getSeedNo('qm_order')
            ];
        })
        .spread(function(consume, staff, order_no) {
            var dept_date = moment(consume.startTime).format('YYYY-MM-DD');

            params.type = 'P';
            params.date = dept_date;
            params.status = 0;
            params.staff_id = account_id;
            params.company_id = staff.companyId;
            params.order_no = order_no;

            if(params.mailing_id) {
                return [true, API.mailingAddress.getMailingAddressById({id: params.mailing_id})];
            }else {
                return [false, null];
            }
        })
        .spread(function(is_has_mailing, mailing_info) {
            if(is_has_mailing && !mailing_info) {
                throw {code: -3, msg: '邮寄地址不存在'};
            }

            if(is_has_mailing) {
                params.mailing_info = mailing_info;
                params.pay_price = Number(params.pay_price) + MAILING_PRICE; //邮寄费
            }

            var _order = _.omit(params, ['mailing']);
            return API.qm_order.create_qm_order(_order);
        })
        .then(function(order) {
            //更新出差记录详情
            return [order, API.tripPlan.updateTripDetail({consumeId: consume_id, userId: account_id, optLog: '通过鲸力差旅管家预定', updates: {orderStatus: 'BOOKED'}})];
        })
        .spread(function(order, result) {
            if(!result) {
                throw {code: -2, msg: '更新出差记录异常'};
            }

            return order;
        })
};

module.exports = airplane;