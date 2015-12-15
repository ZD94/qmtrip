/**
 * Created by wyl on 15-12-9.
 */
'use strict';

var sequelize = require("../models").sequelize;
var staff = sequelize.models.Staff;
var Q = require("q");
var Paginate = require("../../../common/paginate").Paginate;
/**
 * 分页查询员工列表
 * @param query
 * @param options
 * @param callback
 * @returns {*}
 */
function staffList(query, options, callback) {
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
    return staff.findAll(options).nodeify(callback);
}

/**
 * 分页员工列表
 *
 * @param query
 * @param options
 * @param callback
 * @returns {*}
 */
function listAndPaginateStaff(query, options, callback) {
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
    return staff.findAndCountAll(options)
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
    return staff.update(values, options).nodeify(callback);
}

/**
 * 创建员工
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
    return staff.create(values, options).nodeify(callback);
}

/**
 * 根据主键查询
 * @param id
 * @param callback
 * @returns {*}
 */
function getById(id, callback) {
    return staff.findById(id, {fields: ["name"]}).nodeify(callback);
}

/**
 * 更新或者新建
 *
 * @param order
 * @param callback
 * @returns {*}
 */
function saveOrUpdate(staff, callback) {
    if (!staff.id) {
        staff = staff.build(staff);
    }
    return staff.save().nodeify(callback);
}

/**
 * 根据id删除员工
 * @param id
 * @param callback
 * @returns {*}
 */
function deleteById(id, callback){
    return staff.destroy({where: {id: id}}).nodeify(callback);
}

exports.create = create;
exports.deleteById = deleteById;
exports.update = update;
exports.listAndPaginateStaff = listAndPaginateStaff;
exports.staffList = staffList;
exports.getById = getById;
exports.saveOrUpdate = saveOrUpdate;
