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
var cache = require("common/cache");

cache.init({
    redis_conf: "redis://localhost",
    prefix: 'airticket'
});

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
 * @param {string}  params.arrival_station   到达机场 数组，可以传多个
 * @param {Array}   params.airways  航空公司代码，不传则查询所有匹配项，默认为[]\ * @param {string}    params.dept_station   出发机场 数组，可以传多个
 * @param {Array}   params.order    排序eg: ['suggest_price', 'asc|desc']
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
                return API.shengyi_ticket.search_ticket(params);
            }))
        })
        .then(function(result) {
            var airways = params.airways;
            var flight_list = [];
            result.map(function(ret) {
                ret.map(function(flight) {
                    flight.dept_city = params.dept_city;
                    flight.arrival_city = params.arrival_city;
                    flight.query_key = query_key + flight.dept_station_code + flight.arrival_station_code;

                    if(airways && airways.length > 0 && airways.indexOf(flight.airways) < 0) {
                        return;
                    }

                    flight_list.push(flight);
                })
            });

            var order_field = 'suggest_price';
            var order_rule = 'asc';

            if(params.order) {
                order_field = params.order[0] || 'suggest_price';
                order_rule = params.order[1] || 'asc';
            }

            if(flight_list.length > 1) {
                flight_list = _.uniqBy(flight_list, 'flight_no');
                flight_list = _.orderBy(flight_list, [order_field], [order_rule]);
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
            return API.shengyi_ticket.search_more_cabin(params);
        })
        .then(function(flight) {
            var flight_key = flight.flight_no;
            flight.book_id = flight_key;
            return cache.write(flight_key, flight);
        })
        .then(function(ret) {
            return Promise.all(ret.cabins.map(function(cabin) {
                cabin.cabin_id = 'cabin_' + new Date().valueOf() + getRndStr(4);
                console.info(cabin.cabin_id, cabin.cabin, cabin.cabin_type, cabin.cabin_level, cabin.cabin_name, cabin.suggest_price);
                return cache.write(cabin.cabin_id, cabin);
            }));
        })
        .catch(function(err) {
            console.info(err.stack || err);
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
 * @type {book_ticket}
 */
airplane.book_ticket = book_ticket;
book_ticket.required_params = ['flight_no', 'cabin_id', 'pay_price', 'trip_plan_id', 'consume_id',
    'contact_name', 'contact_mobile', 'adult_num', 'passengers'];
book_ticket.optional_params = ['is_need_invoice'];
function book_ticket(params) {
    var self = this;
    params.ip_address = params.remoteAddress;
    var account_id = self.accountId;
    var consume_id = params.consume_id;
    var flight_no = params.flight_no;
    var cabin_id = params.cabin_id;

    return Promise.all([
        API.tripPlan.getConsumeDetail({consumeId: params.consume_id}),
        cache.read(flight_no),
        cache.read(cabin_id)
    ])
        .spread(function(consume, flight_list, cabin) {
            if(consume.orderStatus !== 'WAIT_BOOK') {
                throw {code: -2, msg: '预定失败，请检查出差记录状态'};
            }

            if(!flight_list || !cabin) {
                throw {code: -3, msg: '机票信息已经失效,请刷新后重试!'};
            }

            flight_list.cabin = cabin;
            params.flight_list = flight_list;
            params.airways = flight_list.airways;
            params.punctual_rate = flight_list.punctual_rate;
            params.start_time = flight_list.departure_time;
            params.end_time = flight_list.arrival_time;
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
            params.start_city_code = consume.startPlaceCode;
            params.end_city_code = consume.arrivalPlaceCode;
            params.company_id = staff.companyId;
            params.order_no = order_no;

            return API.qm_order.create_qm_order(params);
        })
        .then(function(order) {
            //更新出差记录详情
            return [order, API.tripPlan.updateConsumeDetail({consumeId: consume_id, userId: account_id, optLog: '通过全麦商旅预定', updates: {orderStatus: 'BOOKED'}})];
        })
        .spread(function(order, result) {
            if(!result) {
                throw {code: -2, msg: '更新出差记录异常'};
            }

            return order;
        })
};

module.exports = airplane;