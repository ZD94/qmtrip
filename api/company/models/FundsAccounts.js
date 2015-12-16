/**
 * Created by yumiao on 15-12-14.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now

module.exports = function (Db, DataType) {
    return Db.define("FundsAccounts", {
        id         : {type: DataType.UUID,                          defaultValue: uuid.v1, primaryKey: true},
        status     : {type: DataType.STRING(11),                    defaultValue: 0},
        paymentPwd : {type: DataType.STRING(50),                    field: "payment_pwd"},
        income     : {type: DataType.NUMERIC(15, 2),                defaultValue: 0},
        consume    : {type: DataType.NUMERIC(15, 2),                defaultValue: 0},
        frozen     : {type: DataType.NUMERIC(15, 2),                defaultValue: 0},
        staffReward: {type: DataType.NUMERIC(15, 2),                field: "staff_reward", defaultValue: 0},
        createAt   : {type: "timestamp without time zone",          field: "create_at", defaultValue: now},
        isSetPwd   : {type: DataType.BOOLEAN,                       field: "is_set_pwd", defaultValue: false},
        updateAt   : {type: "timestamp without time zone",          field: "update_at"},
        balance    : {
            type: DataType.VIRTUAL,
            get: function () {
                return this.income - this.consume - this.frozen;
            }
        }
    }, {
        tableName : "funds_accounts",
        timestamps: false,
        schema    : "company"
    })
}