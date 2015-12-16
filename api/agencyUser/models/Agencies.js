/**
 * Created by wyl on 15-12-11.
 */
var now = require("../../../common/utils").now
module.exports = function(Db, DataType) {

    return Db.define("Agencies", {
        id: {
            type: DataType.UUID,
            primaryKey: true
        },
        /**
         * 代理商姓名
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
         * 代理商头像
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
         * 权限ID
         */
        roleId: {
            type: DataType.INTEGER,
            field: "role_id"
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
        tableName: "agencies",
        timestamps: false,
        schema: "agencyuser"
    } )
}