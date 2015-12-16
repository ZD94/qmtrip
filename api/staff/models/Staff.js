/**
 * Created by wlh on 15/12/9.
 */
var now = require("../../../common/utils").now;
module.exports = function (Db, DataType) {

    return Db.define("Staff", {
        id           : {type: DataType.UUID,        primaryKey: true},
        name         : {type: DataType.STRING(50) }, //员工姓名
        sex          : {type: DataType.INTEGER,     defaultValue: 1}, //性别
        avatar       : {type: DataType.TEXT}, //员工头像
        companyId    : {type: DataType.UUID,        field: "company_id"}, //公司ID
        totalPoints  : {type: DataType.INTEGER,     field: "total_points", defaultValue: 0}, //总获取积分
        balancePoints: {type: DataType.INTEGER,     field: "balance_points", defaultValue: 0}, //剩余积分
        departmentId : {type: DataType.UUID,        field: "department_id"}, //部门ID
        department   : {type: DataType.STRING(50)}, //部门
        travelLevel  : {type: DataType.UUID,        field: "travel_level"}, //差旅标准
        roleId       : {type: DataType.INTEGER,     field: "role_id"}, //权限ID
        email        : {type: DataType.STRING(50) }, //邮箱
        mobile       : {type: DataType.STRING(20) }, //电话
        createAt     : {type: "timestamp",          field: "create_at", defaultValue: now} //创建时间
    }, {
        tableName : "staffs",
        timestamps: false,
        schema    : "staff"
    })
};
