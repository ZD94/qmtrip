/**
 * Created by wyl on 15-12-11.
 */
var now = require("common/utils").now;

module.exports = function(Db, DataType) {
    return Db.define("Agencies", {
        id:         { type: DataType.UUID,      primaryKey: true },
        name:       { type: DataType.STRING(50) }, //代理商姓名
        sex:        { type: DataType.INTEGER,   defaultValue: 1 }, //性别
        email:      { type: DataType.STRING(50) }, //邮箱
        mobile:     { type: DataType.STRING(20) }, //电话
        avatar:     { type: DataType.TEXT       }, //代理商头像
        companyId:  { type: DataType.UUID,      field: "company_id" }, //公司ID
        roleId:     { type: DataType.INTEGER,   field: "role_id" }, //权限ID
        createAt:   { type: DataType.NOW,       field: "create_at", defaultValue: now } //创建时间
    },{
        tableName: "agencies",
        timestamps: false,
        schema: "agencyuser"
    } )
};

