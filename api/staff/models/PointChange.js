/**
 * Created by wyl on 15-12-11.
 */
var uuid = require("node-uuid");
var now = require("../../../common/utils").now
module.exports = function(Db, DataType) {

    return Db.define("PointChange", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        /**
         * 员工id
         */
        staffId: {
            type: DataType.UUID,
            field: "staff_id"
        },
        /**
         * 状态1表示增加-1表示减少
         */
        status: {
            type: DataType.INTEGER,
            field: "status",
            defaultValue: 1
        },
        /**
         * 积分数量
         */
        points: {
            type: DataType.INTEGER,
            field: "points"
        },
        /**
         * 备注
         */
        remark: {
            type: DataType.TEXT,
            field: "remark"
        },
        /**
         * 创建时间
         */
        createAt: {
            type: "timestamp",
            defaultValue: now,
            field: "create_at"
        }
    },{
        tableName: "point_changes",
        timestamps: false,
        schema: "staff"
    } )
}