/**
 * Created by wyl on 15-12-12.
 */
'use strict';

/**
 * @module API
 */
var API = require("common/api");
var _ = require('lodash');
var L = require("common/language");
import types = require("api/_types/travelPolicy");
import {validateApi} from 'common/api/helper';
import { TravelPolicy } from '../../_types/travelPolicy';



/**
 * @class travelPolicy 出差标准
 */
/**
 * @class travelPolicy 出差标准
 */

/**
 * @method createTravelPolicy
 *
 * 企业创建差旅标准
 *
 * @param params
 * @returns {*|Promise}
 */
export function createTravelPolicy (params) : Promise<TravelPolicy>{
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        if(data.code){
                            throw {code: -1, msg: '无权限'};
                        }
                        params.companyId = data.target.companyId;//只允许添加该企业下的差旅标准
                        return API.travelPolicy.createTravelPolicy(params)
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.travelPolicy.createTravelPolicy(params)
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}


/**
 * 企业删除差旅标准
 * @param params
 * @returns {*|Promise}
 */
export function deleteTravelPolicy(params: {id : string, companyId?: string}) : Promise<any>{
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id: user_id})
                    .then(function(data){
                        if(!data){
                            throw {code: -1, msg: '无权限'};
                        }

                        return API.travelPolicy.deleteTravelPolicy({companyId: data.target.companyId, id: params.id});
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                    .then(function(result){
                        if(result){
                            return API.travelPolicy.deleteTravelPolicy(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}



/**
 * 企业更新差旅标准
 * @param id
 * @param params
 * @returns {*|Promise}
 */
export function updateTravelPolicy(params) : Promise<TravelPolicy>{
        var user_id = this.accountId;
        var company_id;
        return API.auth.judgeRoleById({id:user_id})
            .then(function(role){
                if(role == L.RoleType.STAFF){
                    return API.staff.getStaff({id: user_id})
                        .then(function(data){
                            company_id = data.target.companyId;
                            return API.travelPolicy.getTravelPolicy({id: params.id});
                        })
                        .then(function(tp){
                            if(tp.companyId != company_id){
                                throw {code: -1, msg: '无权限'};
                            }
                            params.companyId = company_id;//只允许删除该企业下的差旅标准
                            return API.travelPolicy.updateTravelPolicy(params)
                                .then(function(data){
                                    return new types.TravelPolicy(data);
                                });
                        });
                }else{
                    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                        .then(function(result){
                            if(result){
                                return API.travelPolicy.updateTravelPolicy(params)
                                    .then(function(data){
                                        return new types.TravelPolicy(data);
                                    });
                            }else{
                                throw {code: -1, msg: '无权限'};
                            }
                        })
                }
            })

    }


/**
 * 企业根据id查询差旅标准
 * @param id
 * @returns {*|Promise}
 */
export function getTravelPolicy(params: {id: string, companyId?: string}) : Promise<TravelPolicy>{
    var id = params.id;
    var user_id = this.accountId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
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

                                    if(tp.companyId && tp.companyId != data.target.companyId){
                                        throw {code: -1, msg: '无权限'};
                                    }
                                    return new types.TravelPolicy(tp);
                                });
                        });
                }
            }else{
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
            }
        })

};


/**
 * 员工获取自身差旅标准
 * @returns {*|Promise}
 */
export function getCurrentStaffTp(){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            return data.getTravelPolicy()
        })
        .then(function(travelPolicy){
            if(travelPolicy){
                return  travelPolicy;
            }else{
                return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'})
            }
        })
};


/**
 * 企业分页查询差旅标准
 * @param params
 * @param params.options
 * @param callback
 * @returns {*|Promise}
 */
export function listAndPaginateTravelPolicy(params){
        var user_id = this.accountId;
        return API.auth.judgeRoleById({id:user_id})
            .then(function(role){
                if(role == L.RoleType.STAFF){
                    return API.staff.getStaff({id: user_id})
                        .then(function(data){
                            if(!data){
                                throw {code: -1, msg: '无权限'};
                            }
                            params.companyId = data.target.companyId;//只允许查询该企业下的差旅标准
                            return API.travelPolicy.listAndPaginateTravelPolicy(params);
                        });
                }else{
                    return API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id})
                        .then(function(result){
                            if(result){
                                return API.travelPolicy.listAndPaginateTravelPolicy(params);
                            }else{
                                throw {code: -1, msg: '无权限'};
                            }
                        })
                }
            })

    }


/**
 * 查询企业最新差旅标准
 * @param params
 * @param params.options
 * @param callback
 * @returns {*|Promise}
 */
export function getLatestTravelPolicy(params){
    var user_id = this.accountId;
    return API.staff.getStaff({id: user_id})
        .then(function(data){
            if(data){
                params.companyId = data.target.companyId;//只允许查询该企业下的差旅标准
                return API.travelPolicy.listAndPaginateTravelPolicy(params)
                    .then(function(result){
                        if(result && result.items && result.items.length>0){
                            return new types.TravelPolicy(result.items[0]);
                        }else{
                            return API.travelPolicy.getTravelPolicy({id:'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'})
                        }
                    })
            }else{
                throw {code: -1, msg: '无权限'};
            }
        })
}

/**
 * 企业得到所有差旅标准
 * @param params
 * @returns {*|Promise}
 */
export function getAllTravelPolicy(params){
    var user_id = this.accountId;
    var self = this;
    var companyId = params.companyId;
    var options: any = {
        where: _.pick(params, ['name', 'planeLevel', 'planeDiscount', 'trainLevel', 'hotelLevel', 'hotelPrice', 'companyId', 'isChangeLevel', 'createAt'])
    };
    if(params.columns){
        options.attributes = params.columns;
    }
    if(params.order){
        options.order = params.order;
    }
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id:user_id})
                    .then(function(staff){
                        if(!staff){
                            throw {code: -1, msg: '无权限'};
                        }
                        options.where.companyId = staff.target.companyId;//只允许查询该企业下的差旅标准

                        return API.travelPolicy.getAllTravelPolicy(options);
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: companyId, userId: self.accountId})
                    .then(function(result){
                        if(result){
                            return API.travelPolicy.getAllTravelPolicy(options);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}

/**
 * 企业得到所有差旅标准
 * @param params
 * @returns {*|Promise}
 */
export function getTravelPolicies(params){
    var user_id = this.accountId;
    var self = this;
    var companyId = params.companyId;
    return API.auth.judgeRoleById({id:user_id})
        .then(function(role){
            if(role == L.RoleType.STAFF){
                return API.staff.getStaff({id:user_id})
                    .then(function(staff){
                        if(!staff){
                            throw {code: -1, msg: '无权限'};
                        }
                        params.companyId = staff.target.companyId;//只允许查询该企业下的差旅标准

                        return API.travelPolicy.getTravelPolicies(params);
                    });
            }else{
                return API.company.checkAgencyCompany({companyId: companyId, userId: self.accountId})
                    .then(function(result){
                        if(result){
                            return API.travelPolicy.getTravelPolicies(params);
                        }else{
                            throw {code: -1, msg: '无权限'};
                        }
                    })
            }
        })

}
