/**
 * Created by yumiao on 15-12-11.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now

module.exports = function(Db, DataType) {
    return Db.define("ConsumeDetails", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        /**
         * 计划单id
         */
        orderId: {
            type: DataType.STRING,
            field: "order_id"
        },
        /**
         * 单据所属人
         */
        accountId: {
            type: DataType.UUID,
            field: "account_id"
        },
        /**
         * 计划/预算单号
         */
        orderNo: {
            type: DataType.STRING,
            field: "order_no"
        },
        /**
         * 消费类型（交通和酒店）
         */
        type: {
            type: DataType.INTEGER,
            field: "type"
        },
        /**
         * 状态
         */
        status: {
            type: DataType.INTEGER,
            defaultValue: 0,
            field: "status"
        },
        /**
         * 出发地点
         */
        startPlace: {
            type: DataType.STRING,
            field: "start_place"
        },
        /**
         * 目的地点
         */
        arrivalPlace: {
            type: DataType.STRING,
            field: "arrival_place"
        },
        city: {
            type: DataType.STRING,
            field: "city"
        },
        hotelName: {
            type: DataType.STRING,
            field: "hotel_name"
        },
        /**
         * 开始时间
         */
        startTime: {
            type: "timestamp without time zone",
            field: "start_time"
        },
        /**
         * 结束时间
         */
        endTime: {
            type: "timestamp without time zone",
            field: "end_time"
        },
        /**
         * 预算
         */
        budget: {
            type: DataType.NUMERIC(15, 2),
            field: "budget"
        },
        /**
         * 支出
         */
        expenditure: {
            type: DataType.NUMERIC(15, 2),
            field: "expenditure"
        },
        /**
         * 票据类型
         */
        invoiceType: {
            type: DataType.INTEGER,
            field: "invoice_type"
        },
        /**
         * 票据
         */
        invoice: {
            type: DataType.INTEGER,
            field: "invoice"
        },
        /**
         * 审核备注
         */
        auditRemark: {
            type: DataType.STRING,
            field: 'audit_remark'
        },
        /**
         *创建时间
         */
        createAt: {
            type: "timestamp without time zone",
            field: "create_at",
            defaultValue: now,
        },
        /**
         * 备注
         */
        remark: {
            type: DataType.STRING,
            field: "remark"
        },
        updateAt: {
            type: "timestamp without time zone",
            field: "update_at"
        }
    }, {
        tableName: "consume_details",
        timestamps: false,
        schema: "tripplan"
    })
}