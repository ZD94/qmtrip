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
var API = require('common/api');
import _ = require('lodash');
import moment = require('moment');

var DBM = sequelize.models;
var logger = new Logger('qm_order');
var Paginate = paginate.Paginate;
var QmOrderModel = DBM.QmOrder;
var OrderLogsModel = DBM.OrderLogs;
var now = utils.now;
var qm_order : any = {};

var QM_ORDER_COLS = Object.keys(QmOrderModel.attributes);

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
    PLANE_BOOK_ERROR: {code: -70, msg: '机票预定失败，请检查订单状态'}
};

/**
 * 创建订单
 * @param order
 * @param order.status
 */
qm_order.create_qm_order = function(order) {
    var _qm_order : any = _.pick(order, QM_ORDER_COLS);
    _qm_order.status = STATUS.WAIT_PAY;
    _qm_order.created_at = now();
    _qm_order.expire_at = moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'); //订单30分钟内未支付失效
    _qm_order.id = order.id || uuid.v1();

    return sequelize.transaction(function(t) {
        return Promise.all([
            QmOrderModel.create(_qm_order, {transaction: t}),
            OrderLogsModel.create({order_id: _qm_order.id, user_id: _qm_order.staff_id, type: 0, remark: '创建订单' + _qm_order.order_no,
                created_at: now()}, {transaction: t})
        ])
    })
        .spread(function(_order) {
            if(_order.toJSON) {
                _order = _order.toJSON();
            }

            return _.omit(_order, ['train_no']);
        })
};


/**
 * 查询订单列表分页接口
 * @param params
 */
qm_order.list_qm_orders = function(options) {
    var status = options.where.status;
    typeof status == 'object'?options.where.status.$ne = STATUS.DELETE:options.where.status = status;
    options.attributes = ['id'];
    return QmOrderModel.findAndCount(options)
        .then(function(ret) {
            ret.rows = ret.rows.map(function(r) {
                return r.id;
            });

            return ret;
        })
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
 * 根据查询条件获取全麦订单
 * @param params
 * @returns {Promise<TInstance>}
 */
qm_order.get_qm_order = function(params) {
    var query = _.pick(params, QM_ORDER_COLS);

    return QmOrderModel.findOne(query)
        .then(function(order) {
            if(!order || order.status == STATUS.DELETE) {
                throw ERROR.ORDER_NOT_FOUND;
            }

            return order;
        })
}

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
                    QmOrderModel.update({status: STATUS.DELETE, updated_at: now()}, {where: {id: order_id}, transaction: t}),
                    OrderLogsModel.create({order_id: order_id, user_id: user_id, type: 0, remark: '删除订单' + order.order_no,
                        created_at: now()}, {transaction: t})
                ])
            })
        })
        .spread(function(ret) {
            if(ret != 1) {
                throw ERROR.DELETE_ERROR;
            }

            return true;
        })
};

/**
 * options after order payed
 * 用户支付订单后，预定机票并支付
 * @param params
 */
qm_order.book_and_pay_ticket = function(params) {
    return QmOrderModel.findOne({where: {order_no: params.order_no}})
        .then(function(order) {
            if(order.status != 'WAIT_PAY') {
                throw ERROR.PLANE_BOOK_ERROR;
            };

            var book_params : any = _.pick(order, ['flight_list', 'passengers', 'contact_name', 'contact_mobile', 'adult_num']);
            book_params.ip_address = order.flight_list.ip_address;

            // return [order, API.shengyi_ticket.book_ticket_test(book_params)];
            return [order]
        })
        .spread(function(order, book_result) {
            // return [order, API.shengyi_ticket.get_ticket_order({order_no: book_result.order_no})];
            return [order];
        })
        .spread(function(order, ticket_order) {
            var segment = ticket_order.segments[0];
            var updates ={
                out_order_no: ticket_order.order_no,
                start_time: segment.departure_time,
                end_time: segment.arrival_time,
                ticket_info: segment,
                status: STATUS.WAIT_TICKET, //待出票状态
                updated_at: utils.now(),
                pay_time: utils.now() //支付时间
            };

            return QmOrderModel.update(updates, {returning: true, where: {id: order.id}})
        })
        .spread(function(result, orders) {
            console.info(result);
            var qm_order = orders[0].toJSON();
            console.info(qm_order);
            if(result !== 1) {
                throw ERROR.PLANE_BOOK_ERROR;
            }

            return true;
        })
}


module.exports = qm_order;