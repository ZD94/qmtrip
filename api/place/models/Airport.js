/**
 * Created by wlh on 15/12/22.
 */

module.exports = function(Db, DataType) {
    /**
     * @class Airport 机场信息
     */
    return Db.define("AirPort", {
        id: {   type: DataType.UUID, primaryKey: true},
        name: { type: DataType.STRING(50)},
        skyCode: {type: DataType.STRING(50)},
        cityId: {   type: DataType.UUID},
        latitude: { type: DataType.DOUBLE},
        longitude: { type: DataType.DOUBLE}
    }, {
        schema: "place",
        tableName: "airports",
        timestamps: false
    })
}