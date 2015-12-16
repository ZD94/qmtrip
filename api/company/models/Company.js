/**
 * Created by yumiao on 15-12-9.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {
    return Db.define("Company", {
        id         : {type: DataType.UUID,          defaultValue: uuid.v1, primaryKey: true},
        agencyId   : {type: DataType.UUID,          field: "agency_id"},
        companyNo  : {type: DataType.STRING(30),    field: "company_no"}, //企业编号
        createUser : {type: DataType.UUID,          field: "create_user"}, //企业创建人
        name       : {type: DataType.STRING(100) }, //企业名称
        domainName : {type: DataType.STRING,        field: "domain_name"}, //企业域名
        description: {type: DataType.TEXT }, //企业描述
        status     : {type: DataType.INTEGER,       defaultValue: 0 }, //企业状态
        address    : {type: DataType.STRING }, //企业地址
        email      : {type: DataType.STRING(50) }, //企业邮箱
        telephone  : {type: DataType.STRING(15) }, //联系电话
        mobile     : {type: DataType.STRING(11) }, //联系手机
        staffNum   : {type: DataType.INTEGER,       field: "staff_num"},
        staffScore : {type: DataType.INTEGER,       field: "staff_score"},
        createAt   : {type: "timestamp without time zone", field: "create_at", defaultValue: now}, //创建时间
        remark     : {type: DataType.STRING }, //备注
        updateAt   : {type: "timestamp without time zone", field: "update_at"}
    }, {
        tableName : "company",
        timestamps: false,
        schema    : "company"
    })
};

