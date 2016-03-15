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
        type        : {type: DataType.INTEGER }, //消费类型（交通和酒店）
        status      : {type: DataType.INTEGER,          defaultValue: 0, field: "status"}, //状态
        isCommit    : {type: DataType.BOOLEAN, defaultValue: false, field: 'is_commit'}, //票据是否提交
        startPlace  : {type: DataType.STRING,           field: "start_place"}, //出发地点
        arrivalPlace: {type: DataType.STRING,           field: "arrival_place"}, //目的地点
        city        : {type: DataType.STRING,           field: "city"},
        startPlaceCode   : {type: DataType.STRING,      field: "start_place_code"}, //出发地城市代码
        arrivalPlaceCode  : {type: DataType.STRING,      field: "arrival_place_code"}, //出差目的地城市代码
        cityCode        : {type: DataType.STRING,           field: "city_code"},
        hotelName   : {type: DataType.STRING,           field: "hotel_name"},
        startTime   : {type: "timestamp without time zone", field: "start_time"}, //开始时间
        endTime     : {type: "timestamp without time zone", field: "end_time"}, //结束时间
        latestArriveTime: {type: "timestamp without time zone", field: "latest_arrive_time"}, //最晚到达时间
        budget      : {type: DataType.NUMERIC(15, 2), defaultValue: 0 }, //预算
        expenditure : {type: DataType.NUMERIC(15, 2), defaultValue: 0 }, //支出
        invoiceType : {type: DataType.INTEGER,          field: "invoice_type"}, //票据类型
        invoice     : {type: 'jsonb',           defaultValue: '[]'}, //历史票据json
        newInvoice  : {type: DataType.STRING,            field: 'new_invoice'}, //新上传票据
        auditRemark : {type: DataType.STRING,            field: 'audit_remark'}, //审核备注
        auditUser   : {type: DataType.UUID,             field: 'audit_user'}, //审核人
        createAt    : {type: "timestamp without time zone", field: "create_at", defaultValue: now}, //创建时间
        remark      : {type: DataType.STRING }, //备注
        updateAt    : {type: "timestamp without time zone", field: "update_at"},
        orderStatus: {
            type: DataType.VIRTUAL,
            field: "status",
            set: function (val) {
                var _status = 0;
                switch(val) {
                    case 'DELETE': _status = -2; break;
                    case 'NO_BUDGET': _status = -1; break;
                    case 'NO_COMMIT': _status = 0; break;
                    case 'COMMIT': _status = 1; break;
                    case 'COMPLETE': _status = 2; break;
                    default : _status = 0; break;
                }
                this.setDataValue('status', _status); // Remember to set the data value, otherwise it won't be validated
            },
            get: function () {
                var val = "";
                var _status = this.getDataValue('status');
                switch(_status) {
                    case -2: val = 'DELETE'; break;
                    case -1: val = 'NO_BUDGET'; break;
                    case 0: val = 'NO_COMMIT'; break;
                    case 1: val = 'COMMIT'; break;
                    case 2: val = 'COMPLETE'; break;
                    default : val = 'NO_BUDGET'; break;
                }
                return val;
            }
        }
    }, {
        tableName : "consume_details",
        timestamps: false,
        schema    : "tripplan"
    });
};
