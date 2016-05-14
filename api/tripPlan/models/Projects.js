/**
 * Created by yumiao on 15-12-11.
 */

var uuid = require("node-uuid");
var now = require("common/utils").now;

module.exports = function (Db, DataType) {
    return Db.define("Projects", {
        id          : {type: DataType.UUID,             defaultValue: uuid.v1, primaryKey: true},
        companyId     : {type: DataType.UUID,           field: "company_id"}, //企业id
        code   : {type: DataType.STRING,             field: "code"}, //项目代码
        name        : {type: DataType.STRING,      field: 'name' }, //项目名称
        createUser  : {type: DataType.UUID,     field: 'create_user'}, //创建人
        createdAt     : {type: "timestamp without time zone", field: "created_at", defaultValue: now} //创建时间
    }, {
        tableName : "projects",
        timestamps: false,
        schema    : "tripplan"
    });
};
