/**
 * Created by wlh on 16/1/26.
 */

var uuid = require("node-uuid");
module.exports = function(Db, DataType) {

    return Db.define("Owner", {
        accountId: {type: DataType.UUID},
        fileId: {  type: DataType.UUID, field: "file_id"}
    }, {
        tableName: "owners",
        schema: "attachment",
        updatedAt: "updateAt",
        createdAt: "createAt"
    })
}