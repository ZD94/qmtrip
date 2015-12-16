/**
 * Created by wlh on 15/12/16.
 */

module.exports = function(Db, DataType) {
    return Db.define("BlackDomain", {
        domain: { type: DataType.STRING(255), primaryKey: true  }
    }, {
        tableName: "black_domains",
        timestamps: false,
        schema: "company"
    })
}