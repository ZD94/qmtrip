/**
 * Created by yumiao on 15-12-14.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now

module.exports = function(Db, DataType) {
    return Db.define("MoneyChanges", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        fundsAccountId: {
            type: DataType.UUID,
            field: "funds_account_id"
        },
        status: {
            type: DataType.INTEGER,
            field: "status"
        },
        money: {
            type: DataType.NUMERIC(15,2),
            field: "money"
        },
        channel: {
            type: DataType.STRING,
            field: "channel"
        },
        createAt: {
            type: "timestamp without time zone",
            field: "create_at",
            defaultValue: now
        },
        userId: {
            type: DataType.UUID,
            field: "user_id"
        }
    }, {
        tableName: "money_changes",
        timestamps: false,
        schema: "company"
    })
}