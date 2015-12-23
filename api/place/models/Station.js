/**
 * Created by wlh on 15/12/23.
 */
module.exports = function(Db, DataType) {
    /**
     * @class Station 火车站
     */
    return Db.define("Station", {
        id: { type: DataType.UUID, primaryKey: true},
        name: { type: DataType.STRING(50)},
        longitude: { type: DataType.DOUBLE},
        provinceId: { type: DataType.UUID}
    }, {
        tableName: "stations",
        schema: "place",
        timestamps: false
    })
}