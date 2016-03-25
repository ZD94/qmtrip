/**
 * Created by yumiao on 16-3-24.
 */
'use strict';
/**
 * Created by yumiao on 15-12-9.
 */

var uuid = require("node-uuid");

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
        status: { type: DataType.INTEGER,           field: "status"},
        supplier: { type: DataType.STRING,          field: "supplier"},
        date: { type: DataType.DATE,                field: "date"},
        is_need_invoice: { type: DataType.BOOLEAN,    field: "is_need_invoice",    defaultValue: false},
        cabin_type: { type: DataType.STRING(5),      field: "cabin_type"},
        cabin_name: { type: DataType.STRING(50),     field: "cabin_name"},
        cabin_no: { type: DataType.STRING(50),       field: "cabin_no"},
        seat_no: { type: DataType.STRING(50),        field: "seat_no"},
        room_no: { type: DataType.STRING(50),        field: "room_no"},
        passenger: { type: DataType.JSONB,          field: "passenger"},
        connect_person: { type: DataType.JSONB,      field: "connect_person"},
        money: { type: DataType.NUMERIC(15, 2),     field: "money",    defaultValue: 0},
        payment_method: { type: DataType.INTEGER,    field: "payment_method"},
        payment_info: { type: DataType.JSONB,        field: "payment_info"},
        start_time: { type: "timestamp without time zone",   field: "start_time"},
        end_time: { type: "timestamp without time zone",     field: "end_time"},
        create_at: { type: "timestamp without time zone",    field: "create_at"},
        expire_at: { type: "timestamp without time zone",    field: "expire_at"},
        pay_time: { type: "timestamp without time zone",     field: "pay_time"},
        update_at: {type: "timestamp without time zone",     field: "update_at"},
        TYPE: {
            type: DataType.VIRTUAL,
            get: function() {
                "use strict";
                return {
                    T: '火车',
                    P: '飞机',
                    H: '酒店'
                }
            }
        }
    }, {
        tableName : "qm_order",
        timestamps: false,
        schema    : "qm_order"
    })
};