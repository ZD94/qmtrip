/**
 * Created by yumiao on 15-12-16.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {
    return Db.define("TripPlanLogs", {
        id          : {type: DataType.UUID,             defaultValue: uuid.v1, primaryKey: true},
        tripPlanId     : {type: DataType.UUID,             field: "trip_plan_id"}, //计划单id
        tripDetailId     : {type: DataType.UUID,             field: "trip_detail_id"}, //出差详情id
        userId      : {type: DataType.UUID,             field: "user_id"}, //操作人id
        remark      : {type: DataType.STRING,           field: "remark"}, //操作备注
        createdAt    : {type: "timestamp without time zone", field: "created_at", defaultValue: now} //创建时间
    }, {
        tableName : "trip_plan_logs",
        timestamps: false,
        schema    : "trip_plan"
    });
};
