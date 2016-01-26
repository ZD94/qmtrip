/**
 * Created by wlh on 16/1/26.
 */


module.exports = function(Db, DataType) {

    return Db.define("Owner", {
        accountId: {type: DataType.UUID},
        key: {  type: DataType.STRING(32)}
    }, {
        tableName: "owners",
        schema: "attachment",
        updatedAt: "updateAt",
        createdAt: "createAt"
    })
}