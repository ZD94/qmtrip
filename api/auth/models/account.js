/**
 * Created by wlh on 15/12/9.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now

module.exports = function(Db, DataType) {
    return Db.define("Account", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        /**
         * 邮箱
         */
        email: {
            type: DataType.STRING(255)
        },
        /**
         * 密码
         */
        pwd: {
            type: DataType.STRING(50),
        },
        /**
         * 手机
         */
        mobile: {
            type: DataType.STRING(20)
        },
        /**
         * 状态
         */
        status: {
            type: DataType.INTEGER,
            defaultValue: 0
        },
        /**
         * 创建时间
         */
        createAt: {
            type: "timestamp",
            defaultValue: now,
            field: "create_at"
        },
        /**
         * 禁用失效时间
         */
        forbiddenExpireAt: {
            type: "timestamp",
            field: "forbidden_expire_at"
        },
        /**
         * 连续错误次数
         */
        loginFailTimes: {
            type: DataType.INTEGER,
            defaultValue: 0,
            field: "login_fail_times"
        },
        /**
         * 最近登录时间
         */
        lastLoginAt: {
            type: "timestamp",
            field: "last_login_at"
        },
        /**
         * 最近登录Ip
         */
        lastLoginIp: {
            type: DataType.STRING(50),
            field: "last_login_ip"
        }
    }, {
        tableName: "accounts",
        timestamps: false,
        schema: "auth"
    })
}