/**
 * Created by yumiao on 15-12-10.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {
    return Db.define("TripPlanOrder", {
        id           : {type: DataType.UUID,            defaultValue: uuid.v1, primaryKey: true},
        orderNo      : {type: DataType.STRING,          field: "order_no"}, //计划/预算单号
        accountId    : {type: DataType.UUID,            field: "account_id"}, //单据所属人
        companyId    : {type: DataType.UUID,            field: "company_id"}, //企业id
        type         : {type: DataType.INTEGER}, //单据类型
        projectId    : {type: DataType.UUID,            field: "project_id"},
        description  : {type: DataType.TEXT }, //预算/计划单描述
        status       : {type: DataType.INTEGER,         defaultValue: 0,    field: 'status'}, //企业状态
        isCommit    : {type: DataType.BOOLEAN,          defaultValue: false, field: 'is_commit'}, //票据是否提交
        startPlace   : {type: DataType.STRING,          field: "start_place"}, //出发地
        destination  : {type: DataType.STRING,          field: "destination"}, //出差目的地
        startPlaceCode   : {type: DataType.STRING,      field: "start_place_code"}, //出发地城市代码
        destinationCode  : {type: DataType.STRING,      field: "destination_code"}, //出差目的地城市代码
        startAt      : {type: "timestamp without time zone", field: "start_at"}, //出发时间
        backAt       : {type: "timestamp without time zone", field: "back_at"}, //结束时间
        isNeedTraffic: {type: DataType.BOOLEAN,         field: "is_need_traffic"}, //是否需要交通服务
        isNeedHotel  : {type: DataType.BOOLEAN,         field: "is_need_hotel"}, //是否需要酒店服务
        budget       : {type: DataType.NUMERIC(15, 2) }, //预算
        expenditure   : {type: DataType.NUMERIC(15, 2),  field: "expenditure", defaultValue: 0}, //预定支出
        expendInfo   : {type: DataType.JSONB,           field: "expend_info"}, //支出详情
        auditStatus  : {type: DataType.INTEGER,         field: "audit_status", defaultValue: 0}, //审核状态
        auditRemark  : {type: DataType.STRING,          field: 'audit_remark'}, //审核备注
        score        : {type: DataType.INTEGER,         field: 'score', defaultValue: 0}, //获取的积分
        expireAt     : {type: "timestamp without time zone", field: "expire_at"}, //失效时间
        createAt     : {type: "timestamp without time zone", field: "create_at", defaultValue: now}, //创建时间
        remark       : {type: DataType.STRING }, //备注
        updateAt     : {type: "timestamp without time zone", field: "update_at"},
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
                if(_status == -1) {
                    this.setDataValue('budget', -1);
                }
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
        tableName : "trip_plan_order",
        timestamps: false,
        schema    : "tripplan"
    });
};

