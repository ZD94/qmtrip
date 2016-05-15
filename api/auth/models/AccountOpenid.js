/**
 * Created by yumiao on 16-3-9.
 */

var uuid = require("node-uuid");
var now = require("common/utils").now;

module.exports = function (Db, DataType) {
    return Db.define("AccountOpenid", {
        openId              : {type: DataType.STRING,   field: 'open_id',  primaryKey: true},
        accountId            : {type: DataType.UUID, field: 'account_id'},
        createdAt             : {type: 'timestamp without time zone',    field: "created_at",        defaultValue: now},
        updatedAt     : {type: 'timestamp without time zone',        field: "updated_at"}
    }, {
        tableName : "account_openid",
        timestamps: false,
        schema    : "auth"
    })
};

