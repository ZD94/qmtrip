/**
 * Created by wlh on 16/1/21.
 */

module.exports = function(Db, DataType) {
    return Db.define("Url", {
        id: {   type: DataType.STRING(50), primaryKey: true},
        url: {  type: DataType.TEXT},
        createAt: { type: DataType.DATE, field: "create_at"}
    }, {
        tableName: "urls",
        schema: "shorturl",
        timestamps: false
    });
}