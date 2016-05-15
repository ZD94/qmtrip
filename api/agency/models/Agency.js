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
        description: {type: DataType.TEXT }, //代理商描述
        status     : {type: DataType.INTEGER,       defaultValue: 0 }, //代理商状态
        email      : {type: DataType.STRING(50) }, //代理商邮箱
        telephone  : {type: DataType.STRING(15) }, //联系电话
        mobile     : {type: DataType.STRING(11) }, //联系手机
        companyNum : {type: "timestamp without time zone", field: "company_num", defaultValue: 0}, //企业数量
        createdAt   : {type: "timestamp without time zone", field: "created_at", defaultValue: now}, //创建时间
        remark     : {type: DataType.STRING }, //备注
        updatedAt   : {type: "timestamp without time zone", field: "updated_at"}
    }, {
        tableName: "agency",
        timestamps: false,
        schema: "agency"
    })
};
