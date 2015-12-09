/**
 * Created by wlh on 15/12/9.
 */

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
        powerId: {
            type: DataType.UUID,
            field: "power_id"
        }
    })
}