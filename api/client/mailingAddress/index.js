/**
 * Created by wyl on 16-03-24.
 */
'use strict';

/**
 * @module API
 */
var API = require("@jingli/dnode-api");

/**
 * @class mailingAddress 邮寄地址
 */
var mailingAddress = {};

/**
 * @method createMailingAddress
 *
 * 创建邮寄地址
 *
 * @param {Object} params
 * @param {string} params.name  姓名（必填）
 * @param {string} params.mobile 手机号（必填）
 * @param {string} params.area   地区（必填）
 * @param {string} params.address   详细地址（必填）
 * @param {uuid} params.ownerId    用户id（选填）
 * @param {string} params.zipCode  邮政编码（选填）
 * @param {boolean} params.isDefault 是否默认（选填）
 * @returns {*|Promise}
 */
mailingAddress.createMailingAddress = function(params){
    params.ownerId = this.accountId;
    return API.mailingAddress.createMailingAddress(params);
};


/**
 * @method deleteMailingAddress
 * 
 * 删除邮寄地址
 * 
 * @param params
 * @param {uuid} params.id    删除记录id（必填）
 * @returns {*|Promise}
 */
mailingAddress.deleteMailingAddress = function(params){
    params.ownerId = this.accountId;
    return API.mailingAddress.deleteMailingAddress(params);
};

/**
 * @method updateMailingAddress
 * 
 * 更新邮寄地址
 * 
 * @param {Object} params
 * @param {uuid} params.id    修改记录id（必填）
 * @param {string} params.name  姓名（选填）
 * @param {string} params.mobile 手机号（选填）
 * @param {string} params.area   地区（选填）
 * @param {string} params.address   详细地址（选填）
 * @param {uuid} params.ownerId    用户id（选填）
 * @param {string} params.zipCode  邮政编码（选填）
 * @param {boolean} params.isDefault 是否默认（选填）
 * @returns {*|Promise}
 */
mailingAddress.updateMailingAddress = function(params){
    var user_id = this.accountId;
    return API.mailingAddress.getMailingAddressById({id: params.id})
        .then(function(ma){
            if(ma.ownerId != user_id){
                throw {code: -1, msg: '无权限'};
            }
            params.ownerId = user_id;
            return API.mailingAddress.updateMailingAddress(params);
        });
};

/**
 * @method getMailingAddressById
 * 
 * 根据id查询邮寄地址
 * 
 * @param {Object} params
 * @param {uuid} params.id    查询记录id（必填）
 * @param {Array<String>} params.attributes    查询列（选填）
 * @returns {*|Promise}
 */
mailingAddress.getMailingAddressById = function(params){
    var id = params.id;
    var user_id = this.accountId;
    return API.mailingAddress.getMailingAddressById({id:id})
        .then(function(ma){
            if(!ma){
                throw {code: -1, msg: '查询结果不存在'};
            }

            if(ma.ownerId && ma.ownerId != user_id){
                throw {code: -1, msg: '无权限'};
            }
            return ma;
        });
};

/**
 * @method getCurrentUserMailingAddress
 *
 * 根据ownerId得到邮寄地址
 *
 * @returns {*|Promise}
 */
mailingAddress.getCurrentUserMailingAddress = function(){
    var user_id = this.accountId;
    return API.mailingAddress.getMailingAddressByOwner({ownerId: user_id});
};



/**
 * @method listAndPaginateMailingAddress
 *
 * 分页查询邮寄地址
 *
 * @param {object} params 查询条件
 * @param {uuid} params.ownerId 用户id
 * @param {Array<String>} params.attributes    查询列（选填）
 * @param {object} params.options
 * @param {Integer} params.options options.perPage 每页条数
 * @param {Integer} params.options options.page当前页
 * @param {String|Array}params.options options.order排序
 * @returns {*|Promise}
 */
mailingAddress.listAndPaginateMailingAddress = function(params){
    var user_id = this.accountId;
    params.ownerId = user_id;
    return API.mailingAddress.listAndPaginateMailingAddress(params);
};

module.exports = mailingAddress;