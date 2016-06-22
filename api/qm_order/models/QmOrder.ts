/**
 * Created by yumiao on 16-3-24.
 */
'use strict';
var uuid = require("node-uuid");
import moment = require('moment');

module.exports = function(Db, DataType) {
    return Db.define("QmOrder", {
        id : {type: DataType.UUID,      defaultValue: uuid.v1,  primaryKey: true},
        trip_plan_id: { type: DataType.UUID,          field: "trip_plan_id"},
        consume_id: { type: DataType.UUID,           field: "consume_id"},
        company_id: { type: DataType.UUID,           field: "company_id"},
        staff_id: { type: DataType.UUID,             field: "staff_id"},
        type: { type: DataType.STRING(1),           field: "type"},
        order_no: { type: DataType.STRING(20),       field: "order_no"},
        out_order_no: { type: DataType.STRING(20),    field: "out_order_no"},
        airways: { type: DataType.STRING(5),          field: "airways"},
        date: { type: DataType.DATE,                field: "date",
            get: function() {
                var _date = this.getDataValue('date');
                return moment(_date).format('YYYY-MM-DD');
            }
        },
        is_need_invoice: { type: DataType.BOOLEAN,    field: "is_need_invoice",    defaultValue: false},
        flight_no: { type: DataType.STRING,      field: "flight_no"},
        punctual_rate: { type: DataType.STRING,      field: "punctual_rate"},
        cabin_type: { type: DataType.STRING(5),      field: "cabin_type"},
        cabin_name: { type: DataType.STRING(50),     field: "cabin_name"},
        cabin_no: { type: DataType.STRING(50),       field: "cabin_no"},
        contact_name: { type: DataType.STRING(20),      field: "contact_name"},
        contact_mobile: { type: DataType.STRING(15),      field: "contact_mobile"},
        passengers: { type: DataType.JSONB,          field: "passengers"},
        adult_num: { type: DataType.INTEGER,          field: "adult_num"},
        flight_list: { type: DataType.JSONB,          field: "flight_list"},
        ticket_info: { type: DataType.JSONB,      field: "ticket_info"},
        pay_price: { type: DataType.NUMERIC(15, 2),     field: "pay_price",    defaultValue: 0},
        payment_method: { type: DataType.INTEGER,    field: "payment_method"},
        payment_info: { type: DataType.JSONB,        field: "payment_info"},
        start_city_code: { type: DataType.STRING(10),   field: "start_city_code"},
        end_city_code: { type: DataType.STRING(10),     field: "end_city_code"},
        start_time: { type: DataType.TIME,   field: "start_time"},
        end_time: { type: DataType.TIME,     field: "end_time"},
        mailing_info: { type: DataType.JSONB,      field: "mailing_info"},
        refund_type: { type: DataType.INTEGER,      field: "refund_type"},
        refund_money: { type: DataType.NUMERIC(15, 2),     field: "refund_money"},
        refund_reason: { type: DataType.STRING,      field: "refund_reason"},
        remark: { type: DataType.STRING,     field: "remark"},
        created_at: {
            type: "timestamp without time zone",
            field: "created_at",
            get: function() {
                var _create_at = this.getDataValue('created_at');
                return moment(_create_at).format('YYYY-MM-DD HH:mm:ss');
            }
        },
        expire_at: { type: "timestamp without time zone",    field: "expire_at"},
        pay_time: { type: "timestamp without time zone",     field: "pay_time"},
        updated_at: {type: "timestamp without time zone",     field: "updated_at"},
        status: {
            type: DataType.INTEGER,
            field: 'status',
            get: function() {
                var _status = this.getDataValue('status');
                var result = "";

                switch (_status) {
                    case -4: result = 'DELETE'; break;
                    case -2: result = 'PAY_FAILED'; break;
                    case -1: result = 'CANCEL'; break;
                    case 0: result = 'WAIT_PAY'; break;
                    case 1: result = 'PAY_SUCCESS'; break;
                    case 2: result = 'WAIT_TICKET'; break;
                    case 3: result = 'OUT_TICKET'; break;
                    case 4: result = 'REFUNDING'; break;
                    case 5: result = 'REFUND'; break;
                };

                return result;
            }
        },
        STATUS: {
            type: DataType.VIRTUAL,
            get: function() {
                var _STATUS = {
                    PAY_FAILED: '支付失败', //支付失败
                    CANCEL: '已取消', //已取消
                    WAIT_PAY: '待支付', //待支付
                    PAY_SUCCESS: '支付成功', //支付成功
                    WAIT_TICKET: '待出票', //待出票
                    OUT_TICKET: '已出票', //已出票
                    REFUNDING: '退款中', //退款中
                    REFUND: '已退款' //已退款
                };

                return _STATUS;
            }
        },
        TYPE: {
            type: DataType.VIRTUAL,
            get: function() {
                return {
                    T: '火车',
                    P: '飞机',
                    H: '酒店'
                }
            }
        },
        CABIN_TYPE: {
            type: DataType.VIRTUAL,
            get: function() {
                return {
                    F: '头等舱',
                    C: '商务舱',
                    Y: '经济舱'
                }
            }
        }
    }, {
        tableName : "qm_order",
        timestamps: false,
        schema    : "qm_order"
    })
};