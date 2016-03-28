/**
 * Created by yumiao on 16-3-23.
 */
'use strict';

var L = require("common/language");
var Logger = require('common/logger');
var sequelize = require("common/model").importModel("./models");
var utils = require('common/utils');
var paginate = require("common/paginate");
var uuid = require('node-uuid');
import base_class = require('./qm_order_type');

var Models = sequelize.models;
var logger = new Logger('qm_order');
var QmOrder = base_class.QmOrder;
var OrderLogs = base_class.OrderLogs;
var Paginate = paginate.Paginate;
var QmOrderModel = Models.QmOrder;
var OrderLogsModel = Models.OrderLogs;
var now = utils.now;
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
};

//异常信息
var ERROR = {
    ORDER_NOT_FOUND: {code: -2, msg: '没有该订单'},
    UPDATE_ERROR: {code: -50, msg: '更新错误'},
    DELETE_ERROR: {code: -60, msg: '删除订单出错'},
};

/**
 * 创建订单
 * @param order
 */
qm_order.create_qm_order = function(order) {
    var _qm_order = new QmOrder(order);
    _qm_order.status = STATUS.WAIT_PAY;
    _qm_order.create_at = now();
    _qm_order.id = order.id || uuid.v1();

    return sequelize.transaction(function(t) {
        return Promise.all([
            QmOrderModel.create(_qm_order, {transaction: t}),
            OrderLogsModel.create({order_id: _qm_order.id, user_id: _qm_order.staff_id, type: 0, remark: '创建订单' + _qm_order.order_no,
                create_at: now()}, {transaction: t})
        ])
    })
        .spread(function(_order) {
            return _order;
        })
};


/**
 * 查询订单列表分页接口
 * @param params
 */
qm_order.list_qm_orders = function(options) {
    var status = options.where.status;
    typeof status == 'object'?options.where.status.$ne = STATUS.DELETE:options.where.status = status;
    return QmOrderModel.findAndCount(options);
};


/**
 * 获取订单详情
 * @param params
 * @returns {}
 */
qm_order.get_order_by_id = function(params) {
    return QmOrderModel.findById(params.order_id)
        .then(function(order) {
            if(!order || order.status == STATUS.DELETE) {
                throw ERROR.ORDER_NOT_FOUND;
            }

            return order;
        })
};

/**
 * 删除全麦订单
 * @param params
 * @param {uuid} params.order_id 订单id
 * @returns {any}
 */
qm_order.delete_qm_order = function(params) {
    var order_id = params.order_id;
    var user_id = params.user_id;

    return QmOrderModel.findById(order_id, {attributes: ['status', 'order_no']})
        .then(function(order) {
            if(!order || order.status === STATUS.DELETE) {
                throw ERROR.ORDER_NOT_FOUND;
            }

            if(order.status == STATUS.PAY_SUCCESS) {
                throw {code: -61, msg: '该订单已支付，不能删除'};
            }

            if(order.status == STATUS.WAIT_TICKET) {
                throw {code: -62, msg: '该订单正在出票，不能删除'};
            }

            if(order.status == STATUS.OUT_TICKET) {
                throw {code: -63, msg: '该订单已出票，不能删除'};
            }

            if(order.status == STATUS.REFUNDING) {
                throw {code: -64, msg: '该订单正在退款，不能删除'};
            }

            return sequelize.transaction(function(t) {
                return Promise.all([
                    QmOrderModel.update({status: STATUS.DELETE, update_at: now()}, {where: {id: order_id}, transaction: t}),
                    OrderLogsModel.create({order_id: order_id, user_id: user_id, type: 0, remark: '删除订单' + order.order_no,
                        create_at: now()}, {transaction: t})
                ])
            })
        })
        .spread(function(ret) {
            if(ret != 1) {
                throw ERROR.DELETE_ERROR;
            }

            return true;
        })
}

module.exports = qm_order;