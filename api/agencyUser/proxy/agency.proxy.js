/**
 * Created by wyl on 15-12-11.
 */
'use strict';
var sequelize = require("../models").sequelize;
var agency = sequelize.models.Agencies;
var Q = require("q");
var Paginate = require("./paginate").Paginate;

/**
 * 分页查询代理商列表
 * @param query
 * @param options
 * @param callback
 * @returns {*}
 */
function agencyList(query, options, callback) {
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
    return agency.findAll(options).nodeify(callback);
}

/**
 * 分页代理商列表
 *
 * @param query
 * @param options
 * @param callback
 * @returns {*}
 */
function listAndPaginateAgency(query, options, callback) {
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
    return agency.findAndCountAll(options)
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
    return agency.update(values, options).nodeify(callback);
}

/**
 * 创建代理商
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
    return agency.create(values, options).nodeify(callback);
}

/**
 * 根据主键查询
 * @param id
 * @param callback
 * @returns {*}
 */
function getById(id, callback) {
    return agency.findById(id).nodeify(callback);
}

/**
 * 更新或者新建
 *
 * @param order
 * @param callback
 * @returns {*}
 */
function saveOrUpdate(agency, callback) {
    if (!agency.id) {
        agency = agency.build(agency);
    }
    return agency.save().nodeify(callback);
}

/**
 * 根据id删除代理商
 * @param id
 * @param callback
 * @returns {*}
 */
function deleteById(id, callback){
    return agency.destroy({where: {id: id}}).nodeify(callback);
}

exports.create = create;
exports.deleteById = deleteById;
exports.update = update;
exports.listAndPaginateAgency = listAndPaginateAgency;
exports.agencyList = agencyList;
exports.getById = getById;
exports.saveOrUpdate = saveOrUpdate;