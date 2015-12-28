/**
 * Created by wyl on 15-12-25.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {
    return Db.define("ConsumeDetailsLogs", {
        id          : {type: DataType.UUID,             defaultValue: uuid.v1, primaryKey: true},
        consumeId   : {type: DataType.UUID,             field: "consume_id"}, //差旅消费明细id
        userId      : {type: DataType.UUID,             field: "user_id"}, //操作人id
        status      : {type: DataType.INTEGER}, //审核状态
        remark      : {type: DataType.STRING,           field: "remark"}, //操作备注
        createAt    : {type: "timestamp without time zone", field: "create_at", defaultValue: now} //创建时间
    }, {
        tableName : "consume_details_logs",
        timestamps: false,
        schema    : "tripplan"
    })
};
