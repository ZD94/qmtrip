/**
 * Created by wyl on 15-12-11.
 */
'use strict';
var sequelize = require("common/model").sequelize.importModel("../models").sequelize;
var travalPolicy = sequelize.models.TravalPolicy;
var Q = require("q");
var Paginate = require("../../../common/paginate").Paginate;

/**
 * 分页查询差旅标准列表
 * @param query
 * @param options
 * @param callback
 * @returns {*}
 */
function travalPolicyList(query, options, callback) {
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
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
        perPage = 6;
    }
    limit = perPage;
    offset = (page - 1) * perPage;
    if (!options.order) {
        options.order = [["create_at", "desc"]]
    }
    options.limit = limit;
    options.offset = offset;
    options.where = query;
    return travalPolicy.findAll(options).nodeify(callback);
}

/**
 * 分页差旅标准列表
 *
 * @param query
 * @param options
 * @param callback
 * @returns {*}
 */
function listAndPaginateTravalPolicy(query, options, callback) {
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
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
        perPage = 6;
    }
    limit = perPage;
    offset = (page - 1) * perPage;
    if (!options.order) {
        options.order = [["create_at", "desc"]]
    }
    options.limit = limit;
    options.offset = offset;
    options.where = query;
    return travalPolicy.findAndCountAll(options)
        .then(function(result){
            var pg = new Paginate(page, perPage, result.count, result.rows);
            return pg;
        })
        .nodeify(callback);
}

/**
 * 根据主键更新
 *
 * @param id
 * @param values
 * @param options
 * @param callback
 */
function update(id, values, options, callback) {
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }

    options.where = {id: id};
    options.returning = true;
    return travalPolicy.update(values, options).nodeify(callback);
}

/**
 * 创建差旅标准
 * @param values
 * @param options
 * @param callback
 * @returns {*}
 */
function create(values, options, callback) {
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    return travalPolicy.create(values, options).nodeify(callback);
}

/**
 * 根据主键查询
 * @param id
 * @param callback
 * @returns {*}
 */
function getById(id, callback) {
    return travalPolicy.findById(id).nodeify(callback);
}

/**
 * 更新或者新建
 *
 * @param order
 * @param callback
 * @returns {*}
 */
function saveOrUpdate(travalPolicy, callback) {
    if (!travalPolicy.id) {
        travalPolicy = travalPolicy.build(travalPolicy);
    }
    return travalPolicy.save().nodeify(callback);
}

/**
 * 根据id删除差旅标准
 * @param id
 * @param callback
 * @returns {*}
 */
function deleteById(id, callback){
    return travalPolicy.destroy({where: {id: id}}).nodeify(callback);
}

exports.create = create;
exports.deleteById = deleteById;
exports.update = update;
exports.listAndPaginateTravalPolicy = listAndPaginateTravalPolicy;
exports.travalPolicyList = travalPolicyList;
exports.getById = getById;
exports.saveOrUpdate = saveOrUpdate;