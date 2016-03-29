/**
 * Created by wyl on 16-03-24.
 */
var uuid = require("node-uuid");

module.exports = function (Db, DataType) {

    return Db.define("Papers", {
        id           : {type: DataType.UUID,        defaultValue: uuid.v1, primaryKey: true},
        type         : {type: DataType.INTEGER}, //类型
        idNo         : {type: DataType.STRING(50),      field: "id_no"}, //证件号
        birthday     : {type: "timestamp without time zone"}, //生日
        validData    : {type: "timestamp without time zone",          field: "valid_data"}, //有效期
        ownerId      : {type: DataType.UUID,        field: "owner_id"}, //拥有者ID
    }, {
        tableName : "papers",
        schema    : "staff",
        createdAt: "create_at",
        updatedAt: "update_at"
    })
};
