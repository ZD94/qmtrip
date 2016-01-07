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
    if (!data.hotelPrice || !/^\d+(.\d{1,2})?$/.test(data.hotelPrice)) {
        data.hotelPrice = null;
    }
    return checkParams(["name","planeLevel","planeDiscount","trainLevel","hotelLevel","companyId"], data)
        .then(function(){
            return travalPolicyModel.findOne({where: {name: data.name}})
                .then(function(result){
                    return result;
                })
        })
        .then(function(result){
            if(result){
                throw {msg: "该等级名称已存在，请重新设置"};
            }else{
                return travalPolicyModel.create(data);
            }
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
    return API.staff.findStaffs({travelLevel: id})
        .then(function(staffs){
            if(staffs && staffs.length > 0){
                throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准 暂不能删除，给这些员工匹配新的差旅标准后再进行操作'};
            }else{
                return travalPolicyModel.destroy({where: params})
                    .then(function(obj){
                        return {code: 0, msg: "删除成功"}
                    })
            }
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
travelPolicy.updateTravelPolicy = function(data, callback){
    var id = data.id;
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    delete data.id;
    var options = {};
    options.where = {id: id};
    options.returning = true;
    if (!data.hotelPrice || !/^\d+(.\d{1,2})?$/.test(data.hotelPrice)) {
        data.hotelPrice = null;
    }
    return travalPolicyModel.update(data, options)
        .spread(function(rownum, rows){
            return rows[0];
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
travelPolicy.getTravelPolicy = function(params, callback){
    var id = params.id;
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return travalPolicyModel.findById(id)
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
        .nodeify(callback);
}


/**
 * 分页查询差旅标准集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
travelPolicy.listAndPaginateTravelPolicy = function(params, callback){
    var options = {};
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
            return new Paginate(page, perPage, result.count, result.rows);
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