/**
 * Created by wlh on 15/12/15.
 */

module.exports = function(Db, DataType) {
    return Db.define("Role", {
        /**
         * 角色标示
         */
        role: {
            type: DataType.INTEGER,
            defaultValue: 1,
            primaryKey: true
        },
        /**
         * 角色名称
         */
        name: {
            type: DataType.STRING(50)
        },
        /**
         * 权限列表
         */
        powers: {
            type: DataType.TEXT
        },
        /**
         * 默认归属
         */
        type: {
            type: DataType.INTEGER,
            defaultValue: 1,
            primaryKey: true
        }
    }, {
        tableName: "roles",
        timestamps: false,
        schema: "power"
    })
}