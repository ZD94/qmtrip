/**
 * Created by yumiao on 15-12-11.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {
    return Db.define("ConsumeDetails", {
        id          : {type: DataType.UUID,             defaultValue: uuid.v1, primaryKey: true},
        orderId     : {type: DataType.STRING,           field: "order_id"}, //计划单id
        accountId   : {type: DataType.UUID,             field: "account_id"}, //单据所属人
        orderNo     : {type: DataType.STRING,           field: "order_no"}, //计划/预算单号
        type        : {type: DataType.INTEGER }, //消费类型（交通和酒店）
        status      : {type: DataType.INTEGER,          defaultValue: 0, field: "status"}, //状态
        startPlace  : {type: DataType.STRING,           field: "start_place"}, //出发地点
        arrivalPlace: {type: DataType.STRING,           field: "arrival_place"}, //目的地点
        city        : {type: DataType.STRING },
        hotelName   : {type: DataType.STRING,           field: "hotel_name"},
        startTime   : {type: "timestamp without time zone", field: "start_time"}, //开始时间
        endTime     : {type: "timestamp without time zone", field: "end_time"}, //结束时间
        latestArriveTime: {type: "timestamp without time zone", field: "latest_arrive_time"}, //最晚到达时间
        budget      : {type: DataType.NUMERIC(15, 2) }, //预算
        expenditure : {type: DataType.NUMERIC(15, 2) }, //支出
        invoiceType : {type: DataType.INTEGER,          field: "invoice_type"}, //票据类型
        invoice     : {type: 'jsonb',           defaultValue: '[]'}, //历史票据json
        newInvoice  : {type: DataType.STRING,            field: 'new_invoice'}, //新上传票据
        auditRemark : {type: DataType.STRING,            field: 'audit_remark'}, //审核备注
        createAt    : {type: "timestamp without time zone", field: "create_at", defaultValue: now}, //创建时间
        remark      : {type: DataType.STRING }, //备注
        updateAt    : {type: "timestamp without time zone", field: "update_at"}
    }, {
        tableName : "consume_details",
        timestamps: false,
        schema    : "tripplan"
    })
};
