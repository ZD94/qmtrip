/**
 * Created by wyl on 15-12-11.
 */
var uuid = require("node-uuid");
var now = require("../../../common/utils").now
module.exports = function(Db, DataType) {

    return Db.define("Attachment", {
        id: {
            type: DataType.UUID,
            defaultValue: uuid.v1,
            primaryKey: true
        },
        /**
         * 文件内容md5key
         */
        md5key: {
            type: DataType.STRING(200)
        },
        /**
         * 文件内容
         */
        content: {
            type: "bytea"
        },
        /**
         * 文件名称
         */
        fileName: {
            type: DataType.STRING(200),
            field: "file_name"
        },
        /**
         * 文件类型
         */
        fileType: {
            type: DataType.STRING(100),
            field: "file_type"
        },
        /**
         * 操作人id
         */
        userId: {
            type: DataType.UUID,
            field: "user_id"
        },
        /**
         * 是否公开
         */
        isPublic: {
            type: DataType.BOOLEAN,
            field: "is_public"
        },
        /**
         * 可访问的id
         */
        hasId: {
            type: "jsonb",
            field: "has_id"
        },
        /**
         * 创建时间
         */
        createAt: {
            type: "timestamp",
            defaultValue: now,
            field: "create_at"
        }
    },{
        tableName: "attachment",
        timestamps: false,
        schema: "attachment"
    } )
}