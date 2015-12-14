/**
 * Created by yumiao on 15-12-14.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now

module.exports = function(Db, DataType) {
    return Db.define("FundsAccounts", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        paymentPwd: {
            type: DataType.STRING(50),
            field: "payment_pwd"
        },
        income: {
            type: DataType.NUMERIC(15,2),
            field: "income"
        },
        consume: {
            type: DataType.NUMERIC(15,2),
            field: "consume"
        },
        frozen: {
            type: DataType.NUMERIC(15,2),
            field: "frozen"
        },
        staffReward: {
            type: DataType.NUMERIC(15,2),
            field: "staff_reward"
        },
        createAt: {
            type: "timestamp without time zone",
            field: "create_at",
            defaultValue: now
        },
        isSetPwd: {
            type: DataType.BOOLEAN,
            field: "is_set_pwd"
        },
        updateAt: {
            type: "timestamp without time zone",
            field: "update_at"
        }
    }, {
        tableName: "funds_accounts",
        timestamps: false,
        schema: "company"
    })
}