/**
 * Created by yumiao on 15-12-9.
 */

var API = require('../../common/api');
var Logger = require('../../common/logger');
var logger = new Logger();

var company = {}

//company.__public = true;

/**
 * 创建企业
 * @param params
 * @param callback
 * @returns {*}
 */
company.createCompany = function(params, callback){
    logger.info("createCompany=>\n", params);
    params.createUser = this.accountId;
    return API.company.createCompany(params, callback);
}

module.exports = company;