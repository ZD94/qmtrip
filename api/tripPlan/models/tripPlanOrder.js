/**
 * Created by yumiao on 15-12-9.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now

module.exports = function(Db, DataType) {
    return Db.define("TripPlanOrder", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        /**
         * 计划/预算单号
         */
        orderNo: {
            type: DataType.STRING,
            field: "order_no"
        },
        /**
         * 单据所属人
         */
        accountId: {
            type: DataType.UUID,
            field: "account_id"
        },
        /**
         * 企业id
         */
        companyId: {
            type: DataType.UUID,
            field: "company_id"
        },
        /**
         * 单据类型
         */
        type: {
            type: DataType.INTEGER,
            field: "type"
        },
        /**
         * 预算/计划单描述
         */
        description: {
            type: DataType.TEXT,
            field: "description"
        },
        /**
         * 企业状态
         */
        status: {
            type: DataType.INTEGER,
            defaultValue: 0,
            field: "status"
        },
        /**
         * 出发地
         */
        startPlace: {
            type: DataType.STRING,
            field: "start_place"
        },
        /**
         * 出差目的地
         */
        destination: {
            type: DataType.STRING,
            field: "destination"
        },
        /**
         * 出发时间
         */
        startAt: {
            type: "timestamp without time zone",
            field: "start_at"
        },
        /**
         * 结束时间
         */
        backAt: {
            type: "timestamp without time zone",
            field: "back_at"
        },
        /**
         * 是否需要交通服务
         */
        isNeedTraffic: {
            type: DataType.BOOLEAN,
            field: "is_need_traffic"
        },
        /**
         * 是否需要酒店服务
         */
        isNeedHotel: {
            type: DataType.BOOLEAN,
            field: "is_need_hotel"
        },
        /**
         * 预算
         */
        budget: {
            type: DataType.NUMERIC(15, 2),
            field: "budget"
        },
        /**
         * 预定支出
         */
        bookExpend: {
            type: DataType.NUMERIC(15, 2),
            field: "book_expend"
        },
        /**
         * 支出详情
         */
        expendInfo: {
            type: DataType.JSONB,
            field: "expend_info"
        },
        /**
         * 审核状态
         */
        auditStatus: {
            type: DataType.INTEGER,
            field: "audit_status"
        },
        /**
         * 审核备注
         */
        auditRemark: {
            type: DataType.STRING,
            field: 'audit_remark'
        },
        /**
         * 失效时间
         */
        expireAt: {
            type: "timestamp without time zone",
            field: "expire_at"
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
        tableName: "trip_plan_order",
        timestamps: false,
        schema: "tripplan"
    })
}