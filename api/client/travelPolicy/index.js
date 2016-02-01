/**
 * Created by wyl on 15-12-12.
 */
'use strict';

/**
 * @module API
 */
var API = require("common/api");
var auth = require("../auth");
var _ = require('lodash');

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
 * @returns {*|Promise}
 */
travelPolicy.createTravelPolicy = auth.checkPermission(["travelPolicy.add"],
    function(params){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data.code){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = data.companyId;//只允许添加该企业下的差旅标准
            return API.travelPolicy.createTravelPolicy(params);
        });
});

travelPolicy.agencyCreateTravelPolicy = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.travelPolicy.createTravelPolicy(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * 企业删除差旅标准
 * @param params
 * @returns {*|Promise}
 */
travelPolicy.deleteTravelPolicy = auth.checkPermission(["travelPolicy.delete"],
    function(params){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(!data){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = data.companyId;//只允许删除该企业下的差旅标准
            return API.travelPolicy.deleteTravelPolicy(params);
        });
});

travelPolicy.agencyDeleteTravelPolicy = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.travelPolicy.deleteTravelPolicy(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * 企业更新差旅标准
 * @param id
 * @param params
 * @returns {*|Promise}
 */
travelPolicy.updateTravelPolicy = auth.checkPermission(["travelPolicy.update"],
    function(params){
        var user_id = this.accountId;
        var company_id;
        return API.staff.getStaff({id: user_id})
            .then(function(data){
                company_id = data.companyId;
                return API.travelPolicy.getTravelPolicy({id: params.id});
            })
            .then(function(tp){
                if(tp.companyId != company_id){
                    throw {code: -1, msg: '无权限'};
                }
                params.companyId = company_id;//只允许删除该企业下的差旅标准
                return API.travelPolicy.updateTravelPolicy(params);
            });
    });

travelPolicy.agencyUpdateTravelPolicy = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.travelPolicy.updateTravelPolicy(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};
/**
 * 企业根据id查询差旅标准
 * @param id
 * @returns {*|Promise}
 */
travelPolicy.getTravelPolicy = function(params){
    var id = params.id;
    var user_id = this.accountId;
    if(!id){
        return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'});
    }else{
        return API.staff.getStaff({id: user_id})
            .then(function(data){
                return API.travelPolicy.getTravelPolicy({id:id})
                    .then(function(tp){
                        if(!tp){
                            throw {code: -1, msg: '查询结果不存在'};
                        }
                        if(tp.companyId != data.companyId){
                            throw {code: -1, msg: '无权限'};
                        }
                        return tp;
                    });
            });
    }
};

travelPolicy.agencyGetTravelPolicy = function(params){
    var user_id = this.accountId;
    var id = params.id;
    if(!id){
        return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'});
    }else{
        return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
            .then(function(result){
                if(result){
                    return API.travelPolicy.getTravelPolicy({id:id});
                }else{
                    throw {code: -1, msg: '无权限'};
                }
            })
    }
};
/**
 * 企业分页查询差旅标准
 * @param params
 * @param params.options
 * @param callback
 * @returns {*|Promise}
 */
travelPolicy.listAndPaginateTravelPolicy = auth.checkPermission(["travelPolicy.query"],
    function(params){
        var user_id = this.accountId;
        return API.staff.getStaff({id: user_id})
            .then(function(data){
                if(!data){
                    throw {code: -1, msg: '无权限'};
                }
                params.companyId = data.companyId;//只允许查询该企业下的差旅标准
                return API.travelPolicy.listAndPaginateTravelPolicy(params);
            });
    });

travelPolicy.agencyListAndPaginateTravelPolicy = function(params){
    var user_id = this.accountId;
    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
        .then(function(result){
            if(result){
                return API.travelPolicy.listAndPaginateTravelPolicy(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};

/**
 * 查询企业最新差旅标准
 * @param params
 * @param params.options
 * @param callback
 * @returns {*|Promise}
 */
travelPolicy.getLatestTravelPolicy = auth.checkPermission(["travelPolicy.query"],
    function(params, callback){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                params.companyId = data.companyId;//只允许查询该企业下的差旅标准
                return API.travelPolicy.listAndPaginateTravelPolicy(params)
                    .then(function(result){
                        if(result && result.items && result.items.length>0){
                            return result.items[0];
                        }else{
                            return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'})
                                .then(function(tp){
                                    return tp;
                                })
                        }
                    })
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
        .nodeify(callback);
});

/**
 * 企业得到所有差旅标准
 * @param params
 * @returns {*|Promise}
 */
travelPolicy.getAllTravelPolicy = auth.checkPermission(["travelPolicy.query"],
    function(options){
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
            if(!staff){
                throw {code: -1, msg: '无权限'};
            }
            options.where.companyId = staff.companyId;//只允许查询该企业下的差旅标准

            return API.travelPolicy.getAllTravelPolicy(options);
        });
});

/**
 * 代理商获取企业的差旅标准
 * @param params
 * @returns {*}
 */
travelPolicy.agencyGetAllTravelPolicy = agencyGetAllTravelPolicy;
agencyGetAllTravelPolicy.required_params = ['companyId'];
function agencyGetAllTravelPolicy(params){
    var self = this;
    var companyId = params.companyId;

    var options = {
        where: _.pick(params, ['name', 'planeLevel', 'planeDiscount', 'trainLevel', 'hotelLevel', 'hotelPrice', 'companyId', 'isChangeLevel', 'createAt'])
    };

    if(params.columns){
        options.attributes = params.columns;
    }

    if(params.order){
        options.order = params.order;
    }

    return API.company.checkAgencyCompany({companyId: companyId, userId: self.accountId})
        .then(function(result){
            if(result){
                return API.travelPolicy.getAllTravelPolicy(options);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
};
module.exports = travelPolicy;