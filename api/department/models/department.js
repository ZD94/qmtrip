/**
 * Created by wyl on 16-1-20.
 */
var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {

    return Db.define("Department", {
        id           : {type: DataType.UUID,        defaultValue: uuid.v1, primaryKey: true},
        code         : {type: DataType.STRING(50)}, //部门编码
        name         : {type: DataType.STRING(50)}, //部门名称
        isDefault    : {type: DataType.BOOLEAN,    field: "is_default", defaultValue: false}, //是否默认
        parentId    : {type: DataType.UUID,        field: "parent_id"}, //父级ID
        companyId    : {type: DataType.UUID,       field: "company_id"}, //公司ID
        createAt     : {type: "timestamp",         field: "create_at", defaultValue: now} //创建时间
    }, {
        tableName : "department",
        timestamps: false,
        schema    : "department"
    })
};
