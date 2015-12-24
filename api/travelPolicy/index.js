/**
 * Created by wyl on 15-12-12.
 */
'use strict';
var Q = require("q");
var sequelize = require("common/model").importModel("./models");
var travalPolicyModel = sequelize.models.TravelPolicy;
var Paginate = require("../../common/paginate").Paginate;
var uuid = require("node-uuid");
var L = require("../../common/language");
var API = require("../../common/api");
var travelPolicy = {};

/**
 * 创建差旅标准
 * @param data
 * @param callback
 * @returns {*}
 */
travelPolicy.createTravelPolicy = function(data, callback){
    return checkParams(["name","planeLevel","planeDiscount","trainLevel","hotelLevel","hotelPrice","companyId"], data)
        .then(function(){
            return travalPolicyModel.create(data)
                .then(function(obj){
                    return obj.toJSON();
                })
        })
        .nodeify(callback);
}

/**
 * 删除差旅标准
 * @param params
 * @param callback
 * @returns {*}
 */
travelPolicy.deleteTravelPolicy = function(params, callback){
    var defer = Q.defer();
    var id = params.id;
    if (!id) {
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return travalPolicyModel.destroy({where: params})
        .then(function(obj){
            return {code: 0, msg: "删除成功"}
        })
        .nodeify(callback);
}

/**
 * 更新差旅标准
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
travelPolicy.updateTravelPolicy = function(id, data, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    var options = {};
    options.where = {id: id};
    options.returning = true;
    return travalPolicyModel.update(data, options)
        .then(function(obj){
            return obj[1][0].toJSON();
        })
        .nodeify(callback);
}
/**
 * 根据id查询差旅标准
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
travelPolicy.getTravelPolicy = function(id, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return travalPolicyModel.findById(id)
        .then(function(obj){
            return obj.toJSON();
        })
        .nodeify(callback);
}

/**
 * 得到全部差旅标准
 * @param params
 * @param callback
 * @returns {*}
 */
travelPolicy.getAllTravelPolicy = function(options, callback){
    return travalPolicyModel.findAll(options)
        .then(function(obj){
            obj = obj.map(function(item){
                return item.toJSON();
            })
            return obj;
        })
        .nodeify(callback);
}


/**
 * 分页查询差旅标准集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
travelPolicy.listAndPaginateTravelPolicy = function(params, options, callback){
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
    options.where = params;
    return travalPolicyModel.findAndCountAll(options)
        .then(function(result){
            var items = result.rows.map(function(item) {
                return item.toJSON();
            })
            var pg = new Paginate(page, perPage, result.count, items);
            return pg;
        })
        .nodeify(callback);
}

function checkParams(checkArray, params, callback){
    var defer = Q.defer();
    ///检查参数是否存在
    for(var key in checkArray){
        var name = checkArray[key];
        if(!params[name] && params[name] !== false && params[name] !== 0){
            defer.reject({code:'-1', msg:'参数 params.' + name + '不能为空'});
            return defer.promise.nodeify(callback);
        }
    }
    defer.resolve({code: 0});
    return defer.promise.nodeify(callback);
}
module.exports = travelPolicy;