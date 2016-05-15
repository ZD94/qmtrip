/**
 * Created by wyl on 15-12-12.
 */
var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {

    return Db.define("TravelPolicy", {
        id           : {type: DataType.UUID,        defaultValue: uuid.v1, primaryKey: true},
        name         : {type: DataType.STRING(50)}, //差旅标准名称
        planeLevel   : {type: DataType.STRING(50),  field: "plane_level"}, //机票标准
        planeDiscount: {type: DataType.FLOAT,       field: "plane_discount"}, //机票折扣
        trainLevel   : {type: DataType.STRING(50),  field: "train_level"}, //火车票票标准
        hotelLevel   : {type: DataType.STRING(50),  field: "hotel_level"}, //酒店标准
        hotelPrice   : {type: DataType.FLOAT,       field: "hotel_price"}, //酒店价格
        companyId    : {type: DataType.UUID,        field: "company_id"}, //公司ID
        isChangeLevel: {type: DataType.BOOLEAN,     field: "is_change_level", defaultValue: false}, //公司ID
        createdAt     : {type: "timestamp",          field: "created_at", defaultValue: now} //创建时间
    }, {
        tableName : "travel_policy",
        timestamps: false,
        schema    : "travelpolicy"
    })
};
