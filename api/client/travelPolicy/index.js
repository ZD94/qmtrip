/**
 * Created by wyl on 15-12-12.
 */
'use strict';

/**
 * @module API
 */
var Q = require("q");
var API = require("common/api");
var auth = require("../auth");
/**
 * @class travelPolicy 出差标准
 */
var travelPolicy = {};

/**
 * @method createTravelPolicy
 *
 * 企业创建差旅标准
 *
 * @param params
 * @param callback
 * @returns {*|Promise}
 */
travelPolicy.createTravelPolicy = auth.checkPermission(["travelPolicy.add"],
    function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(!data.code){
                params.companyId = data.companyId;//只允许添加该企业下的差旅标准
                return API.travelPolicy.createTravelPolicy(params);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
        .nodeify(callback);
});

/**
 * 企业删除差旅标准
 * @param params
 * @param callback
 * @returns {*|Promise}
 */
travelPolicy.deleteTravelPolicy = auth.checkPermission(["travelPolicy.delete"],
    function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许删除该企业下的差旅标准
                return API.travelPolicy.deleteTravelPolicy(params);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
        .nodeify(callback);
});

/**
 * 企业更新差旅标准
 * @param id
 * @param params
 * @param callback
 * @returns {*|Promise}
 */
travelPolicy.updateTravelPolicy = auth.checkPermission(["travelPolicy.update"],
    function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            return API.travelPolicy.getTravelPolicy({id: params.id})
                .then(function(tp){
                    if(tp.companyId == data.companyId){
                        params.companyId = data.companyId;//只允许删除该企业下的差旅标准
                        return API.travelPolicy.updateTravelPolicy(params);
                    }else{
                        defer.reject({code: -1, msg: '无权限'});
                        return defer.promise;
                    }
                })
        })
        .nodeify(callback);
});

/**
 * 企业根据id查询差旅标准
 * @param id
 * @param callback
 * @returns {*|Promise}
 */
travelPolicy.getTravelPolicy = function(params, callback){
    var id = params.id;
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(!id){
                if(data.companyId){
                    //若该员工没有指定差旅标准 默认返回该企业最早添加的差旅标准
                    var options = {
                        where: {
                            companyId: data.companyId //只允许查询该企业下的差旅标准
                        }
                    };
                    options.order = "create_at asc";//[["create_at", "desc"]]
                    return API.travelPolicy.getAllTravelPolicy(options)
                        .then(function(obj){
                            if(obj && obj.length > 0){
                               return obj[0];
                            }else{
                                //若该企业没有差旅标准默认返回系统默认差旅标准
                                return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'})
                                    .then(function(tp){
                                        return tp;
                                    })
                            }
                        })
                }else{
                    //若该企业没有差旅标准默认返回系统默认差旅标准
                    return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'})
                        .then(function(tp){
                            return tp;
                        })
                }
            }else{
                return API.travelPolicy.getTravelPolicy({id:id})
                    .then(function(tp){
                        if(tp){
                            if(tp.companyId == data.companyId){
                                return tp;
                            }else{
                                defer.reject({code: -1, msg: '无权限'});
                                return defer.promise;
                            }
                        }else{
                            //若该员工引用的差旅标准被删除使用默认标准（有待修改 被引用的差旅标准 不让删除）
                            return API.travelPolicy.getAllTravelPolicy(options)
                                .then(function(obj){
                                    if(obj && obj.length > 0){
                                        return obj[0];
                                    }else{
                                        //若该企业没有差旅标准默认返回系统默认差旅标准
                                        return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'})
                                            .then(function(tp){
                                                return tp;
                                            })
                                    }
                                })
                        }

                    })
            }
        }).nodeify(callback);
};

/**
 * 企业分页查询差旅标准
 * @param params
 * @param options
 * @param callback
 * @returns {*|Promise}
 */
travelPolicy.listAndPaginateTravelPolicy = auth.checkPermission(["travelPolicy.query"],
    function(params, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许查询该企业下的差旅标准
                return API.travelPolicy.listAndPaginateTravelPolicy(params);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        })
        .nodeify(callback);
});

/**
 * 企业得到所有差旅标准
 * @param params
 * @param callback
 * @returns {*|Promise}
 */
travelPolicy.getAllTravelPolicy = auth.checkPermission(["travelPolicy.query"],
    function(options, callback){
    var defer = Q.defer();
    var user_id = this.accountId;
    if(!options.where){
        options.where = {}
    }
    if(options.columns){
        options.attributes = options.columns;
        delete options.columns;
    }
    return API.staff.getStaff({id:user_id})
        .then(function(staff){
            if(staff){
                options.where.companyId = staff.companyId;//只允许查询该企业下的差旅标准
                return API.travelPolicy.getAllTravelPolicy(options);
            }else{
                defer.reject({code: -1, msg: '无权限'});
                return defer.promise;
            }
        }).nodeify(callback);
});
module.exports = travelPolicy;