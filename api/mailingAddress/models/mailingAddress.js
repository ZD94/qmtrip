/**
 * Created by wyl on 16-03-24.
 */
var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {

    return Db.define("MailingAddress", {
        id           : {type: DataType.UUID,        defaultValue: uuid.v1, primaryKey: true},
        name         : {type: DataType.STRING(50)}, //姓名
        mobile       : {type: DataType.STRING(20)}, //手机
        area         : {type: DataType.STRING(500)}, //地区
        address      : {type: DataType.STRING(500)}, //地址
        zipCode      : {type: DataType.STRING(10),  field: "zip_code"}, //邮政编码
        isDefault    : {type: DataType.BOOLEAN,     field: "is_default", defaultValue: false}, //是否默认
        ownerId      : {type: DataType.UUID,        field: "owner_id"}, //拥有者ID
    }, {
        tableName : "mailing_address",
        schema    : "mailingaddress",
        createdAt: "create_at",
        updatedAt: "update_at"
    })
};
