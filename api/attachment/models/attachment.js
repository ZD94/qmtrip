/**
 * Created by wyl on 15-12-11.
 */
var uuid = require("node-uuid");
var now = require("../../../common/utils").now;
module.exports = function(Db, DataType) {
    return Db.define("Attachment", {
        id          : {type: DataType.UUID,         defaultValue: uuid.v1, primaryKey: true},
        md5key      : {type: DataType.STRING(200)                       }, //文件内容md5key
        content     : {type: "bytea"                                    }, //文件内容
        fileName    : {type: DataType.STRING(200),  field: "file_name"}, //文件名称
        fileType    : {type: DataType.STRING(100),  field: "file_type"}, //文件类型
        userId      : {type: DataType.UUID,         field: "user_id"}, //操作人id
        isPublic    : {type: DataType.BOOLEAN,      field: "is_public"}, //是否公开
        hasId       : {type: "jsonb",               field: "has_id"}, //可访问的id
        createAt    : {type: "timestamp",           field: "create_at", defaultValue: now} //创建时间
    },{
        tableName: "attachment",
        timestamps: false,
        schema: "attachment"
    } )
}