/**
 * Created by wyl on 16-1-21.
 */
var uuid = require("node-uuid");
var now = require("common/utils").now;

export= function (Db: any, DataType: any) {

    return Db.define("Feedback", {
        id           : {type: DataType.UUID,        defaultValue: uuid.v1, primaryKey: true},
        content      : {type: DataType.TEXT}, //反馈内容
        userName     : {type: DataType.STRING(50),       field: "user_name"}, //用户名
        companyName      : {type: DataType.STRING(50),       field: "company_name"}, //企业名
        userId       : {type: DataType.UUID,        field: "user_id"}, //反馈人ID
        isAnonymity  : {type: DataType.BOOLEAN,    field: "is_anonymity", defaultValue: false}, //是否匿名
        createdAt     : {type: DataType.DATE,         field: "created_at", defaultValue: now} //创建时间
    }, {
        tableName : "feedback",
        timestamps: false,
        schema    : "feedback"
    })
};
