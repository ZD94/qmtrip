/**
 * Created by wlh on 15/12/15.
 */

module.exports = function (Db, DataType) {
    return Db.define("Role", {
        role  : { type: DataType.INTEGER,    defaultValue: 1, primaryKey: true}, //角色标示
        name  : { type: DataType.STRING(50) }, //角色名称
        powers: { type: DataType.TEXT }, //权限列表
        type  : { type: DataType.INTEGER,    defaultValue: 1, primaryKey: true} //默认归属
    }, {
        tableName : "roles",
        timestamps: false,
        schema    : "power"
    })
};

