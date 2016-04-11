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
var cache = require("common/cache");

/**
 * @class   qm_order    全麦订单
 */
var qm_order = {};

qm_order.create_qm_order = (params) => {
    var self = this;
    var userId = self.user_id;
    var bookId = params.bookId;
    var totalPrice = params.totalPrice;  //总价钱
    var passengers = params.passengers;  //乘机人信息
    var consumeId = params.consumeId;  //出行单ID
    var cabinId = params.cabinId;       //仓位ID

    return cache.read(bookId)
    .then(function(result) {
        if (!result) {
            throw new Error('机票信息已经失效,请刷新后重试!');
        }
        return API.qm_order.create_qm_order({flightList: result.flight_list, payPrice: totalPrice,
            consumeId: consumeId, passengers: passengers, staffId: userId})
    })
    .then(function(order) {
        return order.id || order;
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