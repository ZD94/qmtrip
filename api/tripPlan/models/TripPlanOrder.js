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
        projectId    : {type: DataType.UUID,            field: "project_id"},
        description  : {type: DataType.TEXT }, //预算/计划单描述
        status       : {type: DataType.INTEGER,         defaultValue: 0,    field: 'status'},
        isInvoiceUpload    : {type: DataType.BOOLEAN,          defaultValue: false, field: 'is_invoice_upload'}, //票据是否上传
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
            set: function (val) {
                var _status = 0;
                var _audit_status = 0;
                var _is_commit = false;
                var _is_upload = false;
                switch(val) {
                    ///删除状态
                    case 'DELETE': _status = -2; break;
                    ///待出预算
                    case 'NO_BUDGET': {
                        _status = -1;
                        this.setDataValue('budget', -1); //预算要小于0
                    } break;
                    ///待上传
                    case 'WAIT_UPLOAD': {
                        _status = 0;
                        _is_upload = false;
                        _is_commit = false;
                    } break;
                    ///待提交
                    case 'WAIT_COMMIT': {
                        _status = 0;
                        _is_upload = true;
                        _is_commit = false;
                    } break;
                    ///待审核
                    case 'WAIT_AUDIT': {
                        _status = 1;
                        _audit_status = 0;
                        _is_upload = true;
                        _is_commit = true;
                    } break;
                    ///审核未通过
                    case 'AUDIT_NOT_PASS': {
                        _status = 0;
                        _audit_status = -1;
                        _is_upload = false;
                        _is_commit = false;
                    } break;
                    ///已完成
                    case 'COMPLETE': {
                        _status = 2;
                        _audit_status = 1;
                    } break;
                    default : _status = 0; break;
                }
                this.setDataValue('status', _status);
                this.setDataValue('auditStatus', _audit_status);
                this.setDataValue('isInvoiceUpload', _is_upload);
                this.setDataValue('isCommit', _is_commit);
            },
            get: function () {
                var val = "";
                var _status = this.getDataValue('status');
                var _audit_status = this.getDataValue('auditStatus');
                var _is_upload = this.getDataValue('isInvoiceUpload');
                switch(_status) {
                    case -2: val = 'DELETE'; break;
                    case -1: val = 'NO_BUDGET'; break;
                    case 0: {
                        val = 'WAIT_UPLOAD';
                        _audit_status === -1 ? val= 'AUDIT_NOT_PASS' : val='WAIT_UPLOAD';
                        if(_audit_status === 0) {
                            _is_upload===true ? val = 'WAIT_COMMIT' : val = 'WAIT_UPLOAD';
                        }
                    } break;
                    case 1: val = 'WAIT_AUDIT'; break;
                    case 2: val = 'COMPLETE'; break;
                    default : val = 'NO_BUDGET'; break;
                }
                return val;
            }
        },
        STATUS: {
            type: DataType.VIRTUAL,
            get: function() {
                "use strict";
                return {
                    NO_BUDGET: 'NO_BUDGET',
                    WAIT_UPLOAD: 'WAIT_UPLOAD',
                    WAIT_COMMIT: 'WAIT_COMMIT',
                    WAIT_AUDIT: 'WAIT_AUDIT',
                    AUDIT_NOT_PASS: 'AUDIT_NOT_PASS',
                    COMPLETE: 'COMPLETE'
                };
            }
        }
    }, {
        tableName : "trip_plan_order",
        timestamps: false,
        schema    : "tripplan"
    });
};

