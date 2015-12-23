/**
 * Created by wlh on 15/12/21.
 */
/**
 * @module models
 */

module.exports = function(Db, DataType) {
    /**
     * @class Country 国家
     */
    return Db.define("Country", {
        id: { type: DataType.UUID, primaryKey: true},
        skyCode: { type: DataType.STRING(50)},
        name: { type: DataType.STRING(50)}
    }, {
        tableName: "countries",
        schema: "place",
        timestamps: false
    })
}