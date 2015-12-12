/**
 * Created by yumiao on 15-12-9.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now

module.exports = function(Db, DataType) {
    return Db.define("Agency", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        agencyNo: {
            type: DataType.STRING(30),
            field: "agency_no"
        },
        /**
         * 代理商创建人
         */
        createUser: {
            type: DataType.UUID,
            field: "create_user"
        },
        /**
         * 代理商名称
         */
        name: {
            type: DataType.STRING(100),
            field: "name"
        },
        /**
         * 代理商logo
         */
        logo: {
            type: DataType.STRING,
            field: "logo"
        },
        /**
         * 代理商描述
         */
        description: {
            type: DataType.TEXT,
            field: "description"
        },
        /**
         * 代理商状态
         */
        status: {
            type: DataType.INTEGER,
            defaultValue: 0,
            field: "status"
        },
        /**
         * 代理商地址
         */
        address: {
            type: DataType.STRING,
            field: "address"
        },
        /**
         * 代理商网址
         */
        website: {
            type: DataType.STRING,
            field: "website"
        },
        /**
         * 代理商邮箱
         */
        email: {
            type: DataType.STRING(50),
            field: "email"
        },
        /**
         * 联系电话
         */
        telephone: {
            type: DataType.STRING(15),
            field: "telephone"
        },
        /**
         * 联系手机
         */
        mobile: {
            type: DataType.STRING(11),
            field: "mobile"
        },
        /**
         * 代理商创建时间
         */
        companyNum: {
            type: "timestamp without time zone",
            field: "company_num"
        },
        /**
         *创建时间
         */
        createAt: {
            type: "timestamp without time zone",
            field: "create_at",
            defaultValue: now
        },
        /**
         * 备注
         */
        remark: {
            type: DataType.STRING,
            field: "remark"
        },
        updateAt: {
            type: "timestamp without time zone",
            field: "update_at"
        }
    }, {
        tableName: "agency",
        timestamps: false,
        schema: "agency"
    })
}