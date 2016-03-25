/**
 * Created by yumiao on 16-3-24.
 */
'use strict';

var uuid = require("node-uuid");

module.exports = function(Db, DataType) {
    return Db.define("OrderLogs", {
        id : {type: DataType.UUID,  defaultValue: uuid.v1, primaryKey: true},
        order_id: {type: DataType.UUID,                  field: "order_id"},
        user_id: {type: DataType.UUID,                   field: "user_id"},
        remark: {type: DataType.STRING(1000),           field: "remark"},
        create_at: {type: "timestamp without time zone", field: "create_at"}
    }, {
        tableName : "order_logs",
        timestamps: false,
        schema    : "qm_order"
    })
};