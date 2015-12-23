/**
 * Created by wlh on 15/12/21.
 */

module.exports = function(Db, DataType) {

    /**
     * @class City 城市信息
     */
    return Db.define("City", {
        id: {   type: DataType.UUID,    primaryKey: true},
        skyCode: {  type: DataType.STRING(50)},
        baiduCode: { type: DataType.STRING(50)},
        name: { type: DataType.STRING(50)},
        latitude: { type: DataType.DOUBLE},
        longitude: { type: DataType.DOUBLE},
        provinceId: { type: DataType.UUID}
    }, {
        tableName: "cities",
        schema: "place",
        timestamps: false
    })
}