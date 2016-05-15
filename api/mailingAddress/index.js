/**
 * Created by wyl on 16-03-24.
 */
'use strict';
var sequelize = require("common/model").importModel("./models");
var mailingAddressModel = sequelize.models.MailingAddress;
var Paginate = require("common/paginate").Paginate;
var API = require("common/api");
var mailingAddress = {};

/**
 * 创建邮寄地址
 * @param params
 * @returns {*}
 */
mailingAddress.createMailingAddress = createMailingAddress;
createMailingAddress.required_params = ['name', 'mobile', 'area', 'address', 'ownerId'];
createMailingAddress.optional_params = ['zipCode', 'isDefault'];
function createMailingAddress(params){
    return mailingAddressModel.create(params);
}

/**
 * 删除邮寄地址
 * @param params
 * @returns {*}
 */
mailingAddress.deleteMailingAddress = deleteMailingAddress;
deleteMailingAddress.required_params = ['id'];
function deleteMailingAddress(params){
    return mailingAddressModel.destroy({where: params})
        .then(function(obj){
            return true;
        });
}

/**
 * 更新邮寄地址
 * @param params
 * @returns {*}
 */
mailingAddress.updateMailingAddress = updateMailingAddress;
updateMailingAddress.required_params = ['id'];
updateMailingAddress.optional_params = ['name', 'mobile', 'area', 'address', 'ownerId', 'zipCode', 'isDefault'];
function updateMailingAddress(params){
    var id = params.id;
    delete params.id;
    var options = {};
    options.where = {id: id};
    options.returning = true;
    return mailingAddressModel.update(params, options)
        .spread(function(rownum, rows){
            return rows[0];
        });
}
/**
 * 根据id查询邮寄地址
 * @param {String} params.id
 * @returns {*}
 */
mailingAddress.getMailingAddressById = getMailingAddressById;
getMailingAddressById.required_params = ['id'];
getMailingAddressById.optional_params = ['attributes'];
function getMailingAddressById(params){
    //return mailingAddressModel.findById(params.id);
    var options = {};
    options.where = {id: params.id};
    options.attributes = params.attributes? ["*"] :params.attributes;
    return mailingAddressModel.findOne(options);
}

/**
 * 根据ownerId得到邮寄地址
 * @param params
 * @returns {}
 */
mailingAddress.getMailingAddressByOwner = getMailingAddressByOwner;
getMailingAddressByOwner.required_params = ['ownerId'];
getMailingAddressByOwner.optional_params = ['attributes'];
function getMailingAddressByOwner(params){
    //return mailingAddressModel.findAll({where: {ownerId: params.ownerId}});
    var options = {};
    options.where = {ownerId: params.ownerId};
    options.attributes = params.attributes? ['*'] :params.attributes;
    return mailingAddressModel.findAll(options);
}

/**
 * 分页查询邮寄地址集合
 * @param {object} params 查询条件
 * @param params.ownerId 用户id
 * @param {object} params.options
 * @param params.options options.perPage 每页条数
 * @param params.options options.page当前页
 * @param {String|Array}params.options options.order排序
 */
mailingAddress.listAndPaginateMailingAddress = function(params){
    var options = {};
    var queryOptions = {};
    if(params.options){
        options = params.options;
        delete params.options;
    }
    var page, perPage, limit, offset;
    if (options.page && /^\d+$/.test(options.page)) {
        page = options.page;
    } else {
        page = 1;
    }
    if (options.perPage && /^\d+$/.test(options.perPage)) {
        perPage = options.perPage;
    } else {
        perPage = 20;
    }
    limit = perPage;
    offset = (page - 1) * perPage;
    if (!options.order) {
        options.order = [["created_at", "desc"]]
    }
    queryOptions.limit = limit;
    queryOptions.offset = offset;
    queryOptions.where = params;
    queryOptions.order = options.order;
    queryOptions.attributes = params.attributes? ['*'] :params.attributes;
    return mailingAddressModel.findAndCountAll(queryOptions)
        .then(function(result){
            return new Paginate(page, perPage, result.count, result.rows);
        });
}

module.exports = mailingAddress;