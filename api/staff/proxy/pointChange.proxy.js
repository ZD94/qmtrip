/**
 * Created by wyl on 15-12-11.
 */
'use strict';
var sequelize = require("../models").sequelize;
var pointChange = sequelize.models.PointChange;
var Q = require("q");
var Paginate = require("../../../common/paginate").Paginate;
/**
 * 分页积分变动记录列表
 *
 * @param query
 * @param options
 * @param callback
 * @returns {*}
 */
function listAndPaginatePointChange(query, options, callback) {
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
    return pointChange.findAndCountAll(options)
        .then(function(result){
            var pg = new Paginate(page, perPage, result.count, result.rows);
            return pg;
        })
        .nodeify(callback);
}

/**
 * 创建积分变动记录
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
    return pointChange.create(values, options).nodeify(callback);
}

/**
 * 根据主键查询
 * @param id
 * @param callback
 * @returns {*}
 */
function getById(id, callback) {
    return pointChange.findById(id).nodeify(callback);
}

/**
 * 根据id删除积分变动记录
 * @param id
 * @param callback
 * @returns {*}
 */
function deleteById(id, callback){
    return pointChange.destroy({where: {id: id}}).nodeify(callback);
}

exports.create = create;
exports.deleteById = deleteById;
exports.listAndPaginatePointChange = listAndPaginatePointChange;
exports.getById = getById;