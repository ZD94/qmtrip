/**
 * Created by yumiao on 15-12-9.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now

module.exports = function(Db, DataType) {
    return Db.define("Company", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        /**
         * 企业编号
         */
        companyNo: {
            type: DataType.STRING(30),
            field: "company_no"
        },
        /**
         * 企业创建人
         */
        createUser: {
            type: DataType.UUID,
            field: "create_user"
        },
        /**
         * 企业名称
         */
        name: {
            type: DataType.STRING(100),
            field: "name"
        },
        /**
         * 企业logo
         */
        logo: {
            type: DataType.STRING,
            field: "logo"
        },
        /**
         * 企业描述
         */
        description: {
            type: DataType.TEXT,
            field: "description"
        },
        /**
         * 企业状态
         */
        status: {
            type: DataType.INTEGER,
            defaultValue: 0,
            field: "status"
        },
        /**
         * 企业地址
         */
        address: {
            type: DataType.STRING,
            field: "address"
        },
        /**
         * 企业网址
         */
        website: {
            type: DataType.STRING,
            field: "website"
        },
        /**
         * 企业邮箱
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
         * 企业创建时间
         */
        companyCreateAt: {
            type: "timestamp without time zone",
            field: "company_create_at"
        },
        /**
         *创建时间
         */
        createAt: {
            type: "timestamp without time zone",
            field: "create_at"
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
        tableName: "company",
        timestamps: false,
        schema: "company"
    })
}