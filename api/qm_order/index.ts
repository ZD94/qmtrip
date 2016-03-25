/**
 * Created by yumiao on 16-3-23.
 */
'use strict';

var L = require("common/language");
var Logger = require('common/logger');
var sequelize = require("common/model").importModel("./models");
var utils = require('common/utils');
var paginate = require("common/paginate");
import base_class = require('./class');

var Models = sequelize.models;
var logger = new Logger('qm_order');
var QmOrder = base_class.QmOrder;
var OrderLogs = base_class.OrderLogs;
var Paginate = paginate.Paginate;
var QmOrderModel = Models.QmOrder;
var qm_order : any = {};

//订单状态
var STATUS = {
    DELETE: -4, //删除状态，不暴露给前端
    PAY_FAILED: -2, //支付失败
    CANCEL: -1, //已取消
    WAIT_PAY: 0, //待支付
    PAY_SUCCESS: 1, //支付成功
    WAIT_TICKET: 2, //待出票
    OUT_TICKET: 3, //已出票
    REFUNDING: 4, //退款中
    REFUND: 5 //已退款
}

/**
 * 创建订单
 * @param order
 */
qm_order.create_qm_order = function(order) {
    var _qm_order = new QmOrder(order);

    _qm_order.status = STATUS.WAIT_PAY;
    return QmOrderModel.create(_qm_order)
};


/**
 * 查询订单列表分页接口
 * @param params
 */
qm_order.page_qm_orders = function(params) {
    return new Promise(function(resolve, reject) {
        var result = new Paginate(params.page, params.per_page, 30, [new QmOrder({id: 'id1'}), new QmOrder({id: 'id2'})]);
        resolve(result);
    });
};


/**
 * 获取订单详情
 * @param params
 * @returns {Promise}
 */
qm_order.get_order_by_id = function(params) {
    return new Promise(function(resolve, reject) {
        var _qm_order = new QmOrder({});
        resolve(_qm_order);
    });
};

module.exports = qm_order;