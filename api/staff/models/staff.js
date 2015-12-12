/**
 * Created by wlh on 15/12/9.
 */
var now = require("../../../common/utils").now
module.exports = function(Db, DataType) {

    return Db.define("Staff", {
        id: {
            type: DataType.UUID,
            primaryKey: true
        },
        /**
         * 员工姓名
         */
        name: {
            type: DataType.STRING(50)
        },
        /**
         * 性别
         */
        sex: {
            type: DataType.INTEGER,
            field: "sex",
            defaultValue: 1
        },
        /**
         * 员工头像
         */
        avatar: {
            type: DataType.TEXT
        },
        /**
         * 公司ID
         */
        companyId: {
            type: DataType.UUID,
            field: "company_id"
        },
        /**
         * 总获取积分
         */
        totalPoints: {
            type: DataType.INTEGER,
            field: "total_points",
            defaultValue: 0
        },
        /**
         * 剩余积分
         */
        balancePoints: {
            type: DataType.INTEGER,
            field: "balance_points",
            defaultValue: 0
        },
        /**
         * 部门ID
         */
        departmentId: {
            type: DataType.UUID,
            field: "department_id"
        },
        /**
         * 差旅标准
         */
        travelLevel: {
            type: DataType.UUID,
            field: "travel_level"
        },
        /**
         * 权限ID
         */
        roleId: {
            type: DataType.INTEGER,
            field: "role_id"
        },
        /**
         * 邮箱
         */
        email: {
            type: DataType.STRING(50),
            field: "email"
        },
        /**
         * 电话
         */
        mobile: {
            type: DataType.STRING(20),
            field: "mobile"
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
        tableName: "staffs",
        timestamps: false,
        schema: "staff"
    } )
}