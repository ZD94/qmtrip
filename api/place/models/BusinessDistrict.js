/**
 * Created by wlh on 15/12/23.
 */


module.exports = function(Db, DataType) {
    /**
     * @class BusinessDistrict 商圈
     */
    return Db.define("BusinessDistrict", {
        id: {   type: DataType.UUID,    primaryKey: true},
        name: { type: DataType.STRING(50)},
        latitude: { type: DataType.DOUBLE},
        longitude: { type: DataType.DOUBLE},
        cityId: {type: DataType.UUID}
    }, {
        tableName: "businessDistricts",
        schema: "place",
        timestamps: false
    })
}