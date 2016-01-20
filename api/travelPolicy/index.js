/**
 * Created by wyl on 15-12-12.
 */
'use strict';
var sequelize = require("common/model").importModel("./models");
var travalPolicyModel = sequelize.models.TravelPolicy;
var Paginate = require("../../common/paginate").Paginate;
var API = require("../../common/api");
var travelPolicy = {};

/**
 * 创建差旅标准
 * @param data
 * @returns {*}
 */
travelPolicy.createTravelPolicy = function(data){
    if (!data.hotelPrice || !/^\d+(.\d{1,2})?$/.test(data.hotelPrice)) {
        data.hotelPrice = null;
    }
    return checkParams(["name","planeLevel","planeDiscount","trainLevel","hotelLevel","companyId"], data)
        .then(function(){
            return travalPolicyModel.findOne({where: {name: data.name, companyId: data.companyId}});
        })
        .then(function(result){
            if(result){
                throw {msg: "该等级名称已存在，请重新设置"};
            }
            return travalPolicyModel.create(data);
        });
}

/**
 * 删除差旅标准
 * @param params
 * @returns {*}
 */
travelPolicy.deleteTravelPolicy = function(params){
    var id = params.id;
    if (!id) {
        throw {code: -1, msg: "id不能为空"};
    }
    return API.staff.findStaffs({travelLevel: id})
        .then(function(staffs){
            if(staffs && staffs.length > 0){
                throw {code: -1, msg: '目前有'+staffs.length+'位员工在使用此标准 暂不能删除，给这些员工匹配新的差旅标准后再进行操作'};
            }
            return travalPolicyModel.destroy({where: params});
        })
        .then(function(obj){
            return true;
        });
}

travelPolicy.deleteTravelPolicyByTest = function(params){
    return travalPolicyModel.destroy({where: {$or: [{name: params.name}, {companyId: params.companyId}]}})
        .then(function(){
            return true;
        })
}

/**
 * 更新差旅标准
 * @param id
 * @param data
 * @returns {*}
 */
travelPolicy.updateTravelPolicy = function(data){
    var id = data.id;
    if(!id){
        throw {code: -1, msg: "id不能为空"};
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
        });
}
/**
 * 根据id查询差旅标准
 * @param {String} params.id
 * @param {Boolean} params.isReturnDefault 如果不存在返回默认 default true,
 * @returns {*}
 */
travelPolicy.getTravelPolicy = function(params){
    var id = params.id;

    var isReturnDefault = params.isReturnDefault;
    if (isReturnDefault !== false) {
        isReturnDefault = true;
    }

    if(!id){
        if (isReturnDefault) {
            return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'});
        } else {
            throw {code: -1, msg: "id不能为空"};
        }
    }

    return travalPolicyModel.findById(id);
}

/**
 * 得到全部差旅标准
 * @param params
 * @returns {*}
 */
travelPolicy.getAllTravelPolicy = function(options){
    return travalPolicyModel.findAll(options);
}


/**
 * 分页查询差旅标准集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 */
travelPolicy.listAndPaginateTravelPolicy = function(params){
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
        });
}

function checkParams(checkArray, params){
    return new Promise(function(resolve, reject){
        ///检查参数是否存在
        for(var key in checkArray){
            var name = checkArray[key];
            if(!params[name] && params[name] !== false && params[name] !== 0){
                return reject({code:'-1', msg:'参数 params.' + name + ' 不能为空'});
            }
        }
        resolve(true);
    });
}
module.exports = travelPolicy;