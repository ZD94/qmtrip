/**
 * Created by wlh on 15/12/14.
 */

var API = require("../../common/api");

module.exports = {
    getMsgCheckCode: function(params, callback) {
        API.checkcode.getMsgCheckCode(params, callback);
    },
    getPicCheckCode: function(params, callback) {
        API.checkcode.getPicCheckCode(params, callback);
    },
}