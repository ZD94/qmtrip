/**
 * Created by wyl on 15-12-11.
 */
var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {

    return Db.define("PointChange", {
        id      : {type: DataType.UUID,     defaultValue: uuid.v1, primaryKey: true},
        companyId : {type: DataType.UUID,     field: "company_id"}, //企业id
        staffId : {type: DataType.UUID,     field: "staff_id"}, //员工id
        orderId : {type: DataType.UUID,     field: "order_id"}, //产生积分的计划单Id
        status  : {type: DataType.INTEGER , defaultValue: 1}, //状态1表示增加-1表示减少
        points  : {type: DataType.INTEGER }, //积分数量
        currentPoint  : {type: DataType.INTEGER, field: "current_point" }, //积分数量
        remark  : {type: DataType.TEXT }, //备注
        createAt: {type: "timestamp",       defaultValue: now, field: "create_at"} //创建时间
    }, {
        tableName : "point_changes",
        timestamps: false,
        schema    : "staff"
    })
};
