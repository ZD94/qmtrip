/**
 * Created by yumiao on 15-12-9.
 */

var uuid = require("node-uuid");
var now = require("../../../common/utils").now

module.exports = function(Db, DataType) {
    return Db.define("Seeds", {
        type: {
            type: DataType.STRING(50),
            field: "type",
            primaryKey: true
        },
        minNo: {
            type: DataType.BIGINT,
            field: "min_no",
            defaultValue: 0
        },
        maxNo: {
            type: DataType.UUID,
            field: "max_no",
            defaultValue: 100000
        },
        nowNo: {
            type: DataType.STRING(100),
            field: "now_no",
            defaultValue: 0
        }
    }, {
        tableName: "seeds",
        timestamps: false,
        schema: "seeds"
    })
}