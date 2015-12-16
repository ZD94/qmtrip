/**
 * Created by yumiao on 15-12-9.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function(Db, DataType) {
    return Db.define("Agency", {
        id         : {type: DataType.UUID,          defaultValue: uuid.v1, primaryKey: true},
        agencyNo   : {type: DataType.STRING(30),    field: "agency_no"},
        createUser : {type: DataType.UUID,          field: "create_user"}, //代理商创建人
        name       : {type: DataType.STRING(100) }, //代理商名称
        logo       : {type: DataType.STRING }, //代理商logo
        description: {type: DataType.TEXT }, //代理商描述
        status     : {type: DataType.INTEGER,       defaultValue: 0 }, //代理商状态
        address    : {type: DataType.STRING }, //代理商地址
        website    : {type: DataType.STRING }, //代理商网址
        email      : {type: DataType.STRING(50) }, //代理商邮箱
        telephone  : {type: DataType.STRING(15) }, //联系电话
        mobile     : {type: DataType.STRING(11) }, //联系手机
        companyNum : {type: "timestamp without time zone", field: "company_num"}, //代理商创建时间
        createAt   : {type: "timestamp without time zone", field: "create_at", defaultValue: now}, //创建时间
        remark     : {type: DataType.STRING }, //备注
        updateAt   : {type: "timestamp without time zone", field: "update_at"}
    }, {
        tableName: "agency",
        timestamps: false,
        schema: "agency"
    })
};
