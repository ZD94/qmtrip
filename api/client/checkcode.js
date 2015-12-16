/**
 * Created by wlh on 15/12/14.
 */

var API = require("../../common/api");

module.exports = {
    __public: true,
    getMsgCheckCode: function(params, callback) {
        var type = 1;
        params.type = 1;
        API.checkcode.getMsgCheckCode(params, callback);
    },
    getPicCheckCode: function(params, callback) {
        var type = 0;
        params.type = 0;
        API.checkcode.getPicCheckCode(params, callback);
    },
}