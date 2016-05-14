/**
 * Created by yumiao on 15-12-11.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now;

module.exports = function (Db, DataType) {
    return Db.define("TripDetail", {
        id          : {type: DataType.UUID,             defaultValue: uuid.v1, primaryKey: true},
        tripPlanId     : {type: DataType.UUID,             field: "trip_plan_id"},
        accountId   : {type: DataType.UUID,             field: "account_id"}, //单据所属人
        type        : {type: DataType.INTEGER }, //消费类型（交通和酒店）
        status      : {type: DataType.INTEGER,          defaultValue: 0, field: "status"}, //状态
        isCommit    : {type: DataType.BOOLEAN, defaultValue: false, field: 'is_commit'}, //票据是否提交
        deptCity  : {type: DataType.STRING,           field: "dept_city"}, //出发地点
        arrivalCity: {type: DataType.STRING,           field: "arrival_city"}, //目的地点
        deptCityCode   : {type: DataType.STRING,      field: "dept_city_code"}, //出发地城市代码
        arrivalCityCode: {type: DataType.STRING,      field: "arrival_city_code"}, //出差目的地城市代码
        city        : {type: DataType.STRING,           field: "city"},
        cityCode        : {type: DataType.STRING,           field: "city_code"},
        hotelName   : {type: DataType.STRING,           field: "hotel_name"},
        startTime   : {type: "timestamp without time zone", field: "start_time"}, //开始时间
        endTime     : {type: "timestamp without time zone", field: "end_time"}, //结束时间
        latestArriveTime: {type: "timestamp without time zone", field: "latest_arrive_time"}, //最晚到达时间
        budget      : {type: DataType.NUMERIC(15, 2), defaultValue: 0 }, //预算
        expenditure : {type: DataType.NUMERIC(15, 2), defaultValue: 0 }, //支出
        //invoiceType : {type: DataType.INTEGER,          field: "invoice_type"}, //票据类型
        invoiceType : {
            type: DataType.INTEGER,
            field: 'invoice_type',
            set: function(val) {
                "use strict";
                var _value = -1;
                switch (val) {
                    case 'TRAIN': _value = 0; break; //火车票
                    case 'PLANE': _value = 1; break; //飞机票
                    case 'HOTEL': _value = 2; break; //酒店发票
                    default : ; break;
                }
                this.setDataValue('invoiceType', _value);
            },
            get: function(){
                "use strict";
                var _value = this.getDataValue('invoiceType');
                var result = '';
                switch (_value) {
                    case -1: result = 'GET INVOICE TYPE ERROR!'; break;
                    case  0: result = 'TRAIN'; break;
                    case  1: result = 'PLANE'; break;
                    case  2: result = 'HOTEL'; break;
                    default : result = 'GET INVOICE TYPE ERROR!'; break
                }
                return result;
            }
        },
        invoice     : {type: 'jsonb',           defaultValue: '[]'}, //历史票据json
        newInvoice  : {type: DataType.STRING,            field: 'new_invoice'}, //新上传票据
        auditRemark : {type: DataType.STRING,            field: 'audit_remark'}, //审核备注
        auditUser   : {type: DataType.UUID,             field: 'audit_user'}, //审核人
        createdAt    : {type: "timestamp without time zone", field: "created_at", defaultValue: now}, //创建时间
        updatedAt    : {type: "timestamp without time zone", field: "updated_at"},
        deletedAt    : {type: "timestamp without time zone", field: "deleted_at"},
        commitTime  : {type: "timestamp without time zone", field: "commit_time"},
        remark      : {type: DataType.STRING }, //备注
        orderStatus: {
            type: DataType.VIRTUAL,
            set: function (val) {
                var _status = 0;
                var _is_commit = false;
                switch(val) {
                    ///删除状态
                    case 'DELETE': _status = -2; break;
                    ///待出预算状态
                    case 'NO_BUDGET': {
                        _status = 0;
                        _is_commit = false;
                    } break;
                    ///待上传状态
                    case 'WAIT_UPLOAD': {
                        _status = 0;
                        _is_commit = false;
                    } break;
                    ///待提交
                    case 'WAIT_COMMIT': {
                        _status = 0;
                        _is_commit = false;
                    } break;
                    ///待审核状态
                    case 'WAIT_AUDIT': {
                        _status = 0;
                        _is_commit = true;
                    } break;
                    ///审核未通过
                    case 'AUDIT_NOT_PASS': {
                        _status = -1;
                        _is_commit = false;
                    } break;
                    ///已完成状态
                    case 'AUDIT_PASS': {
                        _status = 1;
                        _is_commit = true;
                    } break;
                    default : _status = 0; break;
                }
                this.setDataValue('status', _status);
                this.setDataValue('isCommit', _is_commit);
            },
            get: function () {
                var val = "";
                var _status = this.getDataValue('status');
                var _is_commit = this.getDataValue('isCommit');
                var _invoice = this.getDataValue('newInvoice');
                var _budget = this.getDataValue('budget');

                switch(_status) {
                    case -2: val = 'DELETE'; break;
                    case -1: val = 'AUDIT_NOT_PASS'; break;
                    case 0: {
                        val = 'WAIT_UPLOAD';

                        if(_invoice) {
                            val = 'WAIT_COMMIT';
                        }

                        if(_is_commit) {
                            val = 'WAIT_AUDIT';
                        }

                        if(_budget <= 0) {
                            val = 'NO_BUDGET';
                        }
                    } break;
                    case 1: val = 'AUDIT_PASS'; break;
                }
                return val;
            }
        },
        STATUS: {
            type: DataType.VIRTUAL,
            get: function(){
                return {
                    WAIT_UPLOAD: '待上传',
                    WAIT_COMMIT: '待提交',
                    WAIT_AUDIT: '审核中',
                    AUDIT_NOT_PASS: '审核未通过',
                    AUDIT_PASS: '审核通过'
                }
            }
        }
    }, {
        tableName : "trip_details",
        timestamps: false,
        schema    : "tripplan"
    });
};