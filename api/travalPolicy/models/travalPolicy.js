/**
 * Created by wyl on 15-12-12.
 */
var uuid = require("node-uuid");
var now = require("../../../common/utils").now
module.exports = function(Db, DataType) {

    return Db.define("TravalPolicy", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        /**
         * 差旅标准名称
         */
        name: {
            type: DataType.STRING(50)
        },
        /**
         * 机票标准
         */
        planeLevel: {
            type: DataType.STRING(50),
            field: "plane_level"
        },
        /**
         * 机票折扣
         */
        planeDiscount: {
            type: DataType.FLOAT,
            field: "plane_discount"
        },
        /**
         * 火车票票标准
         */
        trainLevel: {
            type: DataType.STRING(50),
            field: "train_level"
        },
        /**
         * 酒店标准
         */
        hotelTevel: {
            type: DataType.STRING(50),
            field: "hotel_tevel"
        },
        /**
         * 酒店价格
         */
        hotelPrice: {
            type: DataType.FLOAT,
            field: "hotel_price"
        },
        /**
         * 公司ID
         */
        companyId: {
            type: DataType.UUID,
            field: "company_id"
        },
        /**
         * 公司ID
         */
        isChangeLevel: {
            type: DataType.BOOLEAN,
            defaultValue: false,
            field: "is_change_level"
        },
        /**
         * 创建时间
         */
        createAt: {
            type: "timestamp",
            defaultValue: now,
            field: "create_at"
        }
    },{
        tableName: "traval_policy",
        timestamps: false,
        schema: "travalpolicy"
    } )
}