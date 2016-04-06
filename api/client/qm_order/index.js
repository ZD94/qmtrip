/**
 * Created by yumiao on 16-03-24.
 */
'use strict';

var API = require("common/api");
var L = require("common/language");
var Logger = require('common/logger');
var paginate = require("common/paginate");
var _ = require('lodash');

var logger = new Logger('client/qm_order');
var Paginate = paginate.Paginate;

/**
 * @class   qm_order    全麦订单
 */
var qm_order = {};

/**
 * @method  API.qm_order.create_order
 *
 * 创建全麦订单
 * @param   {object}    params
 * @param   {uuid}      params.trip_plan_id    出差记录id   必须
 * @param   {uuid}      params.consume_id      对应票据id   必须
 * @param   {string}    params.flight_no       航班号       必须
 * @param   {string}    params.start_city_code 出发城市代码     必须
 * @param   {string}    params.end_city_code   到达城市代码     必须
 * @param   {string}    params.airways         航空公司     必须
 * @param   {string}    params.pay_price       支付金额     必须
 * @param   {string}    params.cabin_type      舱位类型    必须
 * @param   {string}    params.date            出行/住宿日期
 * @param   {json}      params.passenger       旅客信息
 * @param   {string}    params.contact_name    联系人姓名
 * @param   {string}    params.contact_mobile  联系人手机
 *
 * @returns {Promise<T>}   qm_order    订单详情
 */
qm_order.create_order = create_order;
create_order.required_params = ['trip_plan_id', 'consume_id', 'flight_no', 'start_city_code', 'end_city_code', 'airways', 'pay_price', 'cabin_type', 'date'];
create_order.optional_params = ['passenger', 'contact_name', 'contact_mobile']
function create_order(params) {
    var self = this;
    var account_id = self.accountId;
    var consume_id = params.consume_id;

    return API.tripPlan.getConsumeDetail({consumeId: consume_id})
        .then(function(consume) {
            //只有出差记录状态为待预定时才能创建全麦订单
            if(consume.orderStatus !== 'WAIT_BOOK') {
                throw {code: -2, msg: '预定失败，请检查出差记录状态'};
            }

            return Promise.all([
                consume,
                API.staff.getStaff({id: account_id, columns: ['companyId']}),
                API.seeds.getSeedNo('qm_order'),
            ])
        })

        .spread(function(consume, staff, order_no) {
            params.staff_id = account_id;
            params.company_id = staff.companyId;
            params.order_no = order_no;
            params.type = 'P';
            return API.qm_order.create_qm_order(params);
        })
        .then(function(order) {
            //更新出差记录详情
            return [order, API.tripPlan.updateConsumeDetail({consumeId: consume_id, userId: account_id, optLog: '通过全麦商旅预定', updates: {orderStatus: 'BOOKED'}})]
        })
        .spread(function(qm_order, result) {
            if(!result) {
                throw {code: -2, msg: '更新出差记录异常'};
            }

            return qm_order;
        })
}

/**
 * @method  get_qm_order
 * 获取全麦订单详情
 * @param params
 * @param {uuid} params.order_id  订单id
 * @returns {*}
 */
qm_order.get_qm_order = get_qm_order;
get_qm_order.required_params = ['order_id'];
function get_qm_order(params) {
    var self = this;
    return API.staff.getStaff({id: self.accountId})
        .then(function() {
            return API.qm_order.get_order_by_id(params);
        })
};

/**
 * 根据订单号获取订单
 * @type {getByOutOrderNo}
 */
qm_order.getByOutOrderNo = getByOutOrderNo;
getByOutOrderNo.required_params = ['out_order_no'];
function getByOutOrderNo(params) {
    var self = this;

    return API.staff.getStaff({id: self.accountId})
        .then(function() {
            return API.qm_order.get_qm_order(params);
        })
}

/**
 * @method  get_orders_plan_id
 * 根据出差记录获取所有订单信息
 * @param params
 * @param {uuid}    params.trip_plan_id  计划单id
 * @param {Array}   params.order    排序 默认: ['date', 'asc']
 * @returns {Array}
 */
qm_order.get_orders_plan_id = get_orders_plan_id;
get_orders_plan_id.required_params = ['trip_plan_id'];
get_orders_plan_id.optional_params = ['order'];
function get_orders_plan_id(params) {
    var self = this;
    return API.staff.getStaff({id: self.accountId, columns: ['id', 'companyId']})
        .then(function(staff) {
            params.staff_id = staff.id;
            params.company_id = staff.companyId;

            var options = {
                where: _.pick(params, ['staff_id', 'trip_plan_id', 'company_id'])
            };
            params.order ? options.order = [params.order] : options.order = [['date', 'asc']];

            return API.qm_order.list_qm_orders(options);
        })
        .then(function(ret) {
            return ret.rows;
        })
}

/**
 * @method  page_qm_orders
 * 查询订单列表分页接口
 * @param params
 * @param {integer} params.page   查询页数 默认: 1
 * @param {integer} params.per_page  查询每页记录数目 默认: 10
 * @param {Array}   params.order    排序 默认: ['date', 'asc']
 * @returns {Array} list
 */
qm_order.page_qm_orders = page_qm_orders;
page_qm_orders.optional_params = ['page', 'per_page', 'order'];
function page_qm_orders(params) {
    var self = this;
    var account_id = self.accountId;
    var page = params.page || 1;
    var per_page = params.per_page || 10;

    return API.staff.getStaff({id: account_id, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function(company_id) {
            params.company_id = company_id;
            params.staff_id = account_id;

            var options = {
                where: _.omit(params, ['page', 'per_page', 'order'])
            };
            options.where.status = {$ne: -4};
            params.order ? options.order = [params.order] : options.order = [['date', 'asc']];

            return API.qm_order.list_qm_orders(options)
        })
        .then(function(ret) {
            console.info(ret);
            return new Paginate(page, per_page, ret.count, ret.rows);
        })
};

/**
 * @method  delete_order
 * 删除订单
 *
 * @param {uuiid} params.order_id   订单id
 * @type {delete_order}
 */
qm_order.delete_order = delete_order;
delete_order.required_params = ['order_id'];
function delete_order(params) {
    var self = this;

    return API.staff.getStaff({id: self.accountId, columns: ['id']})
        .then(function(staff) {
            params.user_id = staff.id;

            return API.qm_order.delete_qm_order(params);
        })
}

module.exports = qm_order;