/**
 * Created by yumiao on 16-03-24.
 */
'use strict';

var API = require("common/api");
var L = require("common/language");
var Logger = require('common/logger');
var _ = require('lodash');

var logger = new Logger('client/qm_order');
var qm_order = {};

/**
 * 获取舱位信息
 * @param   {object}    params
 * @param   {uuid}      params.trip_plan_id    出差记录id
 * @param   {uuid}      params.consume_id      对应票据id
 * @param   {string}    params.out_order_no    外部订单号
 * @param   {string}    params.money           订单金额
 * @param   {string}    params.type            订单类型 T: '火车', P: '飞机', H: '酒店'
 * @param   {string}    params.supplier        供应商
 * @param   {string}    params.date            出行/住宿日期
 * @param   {string}    params.cabin_type      舱位/座次/房间类型
 * @param   {string}    params.cabin_name      舱位/座次/房间
 * @param   {string}    params.cabin_no        座位号/房间号
 * @param   {json}      params.passenger       旅客信息
 * @param   {json}      params.connect_person  联系人信息
 * @param   {string}    params.payment_method  支付方式
 *
 * @returns {*}
 */
qm_order.create_order = create_order;
create_order.required_params = ['trip_plan_id', 'consume_id', 'out_order_no'];
function create_order(params) {
    var self = this;
    var account_id = self.accountId;

    return Promise.all([
        API.staff.getStaff({id: account_id, columns: ['companyId']}),
        API.seeds.getSeedNo('tripPlanOrderNo'),
    ])
        .spread(function(staff, order_no) {
            params.staff_id = account_id;
            params.company_id = staff.companyId;
            params.order_no = order_no;
            return API.qm_order.create_qm_order(params);
        })
}

/**
 * 查询订单列表分页接口
 * @param params
 * @param {integer} params.page   查询页数
 * @param {integer} params.per_page  查询每页记录数目
 * @returns {Array} list
 */
qm_order.page_qm_orders = page_qm_orders;
page_qm_orders.optional_params = ['page', 'per_page'];
function page_qm_orders(params) {
    var self = this;
    var account_id = self.accountId;

    return API.staff.getStaff({id: account_id, columns: ['companyId']})
        .then(function (staff) {
            return staff.companyId;
        })
        .then(function(company_id) {
            params.company_id = company_id;
            params.staff_id = account_id;
            return API.qm_order.page_qm_orders(params);
        })
};

/**
 * 获取舱位信息
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
}

module.exports = qm_order;