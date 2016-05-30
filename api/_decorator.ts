import { getSession } from '../common/model/index';
import { Staff, EStaffRole } from './_types/staff';
import { AgencyUser } from './_types/agency';
import {EAccountType} from "./_types/index";
/**
 * Created by wlh on 16/5/16.
 */
const API = require("common/api");
const _ = require("lodash");
const L = require("common/language");
const Models = require("api/_types").Models;

export function requirePermit(permits: string| string[], type?: number) {
    return function (target, key, desc) {
        let fn = desc.value;
        desc.value = async function (...args) {
            let context = Zone.current.get('context');
            let session = getSession();
            let account = Models.account.get(session.accountId);
            if(!account)
                throw L.ERR.PERMISSION_DENIED();

            await API.permit.checkPermission({accountId: session.accountId, permissions: permits, type: account.type});

            return fn.apply(this, args)
        }
        return desc;
    }
}

export interface CheckInterface {
    if: (fn: Function, self: any, args: any) => Promise<boolean>,
    then?: (target: Function, string: any, desc: any) => Promise<any>    //then函数直接是decorator函数
}

//
// function _getTestAccountId() {
//     return 1;
// }
//
// function _testDecorator(idpath: string) {
//     return function(fn: Function, self: any, args: any) {
//         let id = _.get(args, idpath);
//         return Promise.resolve(id == _getTestAccountId());
//     }
// }
//
// class Test2 {
//     @conditionDecorator([
//         {"if": _testDecorator("0.id"), "then": filterResultColumn(["id", "username"])} as CheckInterface,
//     ])
//     static myTest(params) {
//         let result = {
//             id: "1",
//             username: "王大拿",
//             password: "time9818",
//             sex: '男'
//         };
//         return Promise.resolve(result);
//     }
//
//     @conditionDecorator([
//         {"if": _testDecorator("0.id")}
//     ])
//     static myTest2(params) {
//         let result = {
//             username: "username",
//             password: "password"
//         }
//         return Promise.resolve(result);
//     }
// }
//
// Test2.myTest({"id": "1"})
//     .then(function(result) {
//         console.info("函数最终返回值是:", result);
//     })
//     .catch(function(err) {
//         console.info(err);
//     })
//
// Test2.myTest2({"id": "1"})
//     .then(function(result) {
//         console.info("MyTest2最终返回值是:", result);
//     })
//     .catch(function(err) {
//         console.info(err);
//     })

//筛选返回结果
export function filterResultColumn(columns: string[]) {
    return function (target, key, desc) {
        let fn = desc.value;
        desc.value = function(...args) {
            let self = this;
            return fn.apply(self, args)
                .then(function(result) {
                    for(let k in result) {
                        if (columns.indexOf(k) < 0) {
                            delete result[k];
                        }
                    }
                    return result;
                })
        }
        return desc;
    }
}

//追加函数参数
export function addFuncParams(params) {
    return function(target, key, desc) {
        let fn = desc.value;
        desc.value = function(...args) {
            let self = this;
            for(let key of params) {
                args[0][key] = params[key];
            }
            return fn.apply(self, args);
        }
        return desc;
    }
}

/**
 * 判断不为空
 * @param params
 * @constructor
 */
export function modelNotNull(modname: string, keyName?: string) {
    return function(target, key, desc) {
        let fn = desc.value;
        desc.value = async function(...args) {
            let self = this;
            keyName = keyName || 'id';
            let entity = await Models[modname].get(args[0][keyName]);

            if(!entity) {
                throw L.ERR.NOT_FOUND();
            }

            return fn.apply(self, args);
        }
        return desc;
    }
}

export function conditionDecorator(checkFnList: CheckInterface[]) {
    return function (target, key, desc) {
        let fn = desc.value;
        desc.value = async function(...args) {
            //在这里才能拿到参数
            let self = this;
            let thenFn;
            for(let checkFn of checkFnList) {
                let ret = await checkFn.if(fn, self, args);
                //如果返回true,执行then函数
                if (!!ret) {
                    thenFn = checkFn.then;
                    if (!thenFn) {
                        //如果then不存在,直接处理原函数
                        return fn.apply(self, args);
                    }

                    //判断完if后,将desc还原为原来的函数,否则将引起死循环
                    desc.value = fn;
                    //self作用于也要一并传过去
                    return thenFn(target, key, desc).value.apply(self, args)
                }
            }
            throw L.ERR.PERMISSION_DENY();
        }
        return desc;
    }
}

export var condition = {
    isMySelf: function (idpath: string) {
        return async function (fn, self, args) {
            let session = getSession();
            let id = _.get(args, idpath);
            return id && session.accountId && id == session.accountId;
        }
    },
    isMyCompany: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            return id && staff && staff.company && staff.company.id == id;
        }
    },
    isMyCompanyAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            return id && staff && staff.company && staff.company["agencyId"] == id;
        }
    },
    isMyAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let agencyUser = await AgencyUser.getCurrent();
            return id && agencyUser && agencyUser.agency.id == id;
        }
    },
    isStaffsAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Models.staff.get(id);
            // let company = staff.company;
            let company = await Models.company.get(staff["companyId"]);
            let agencyUser = await AgencyUser.getCurrent();
            return staff && company && agencyUser && agencyUser["agencyId"] == company["agencyId"];
        }
    },
    isSameCompany: function (idpath:string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let other = await Models.staff.get(id);
            return id && staff && other && staff["companyId"] == other["companyId"];
        }
    },
    isSameAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let other = await Models.agencyUser.get(id);
            if(!other) {
                throw L.ERR.AGENCY_USER_NOT_EXIST();
            }
            return id && user && other && user["agencyId"] == other.agencyId;
        }
    },
    isTravelPolicyAdminOrOwner: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let tp = await Models.travelPolicy.get(id);
            return id && staff && tp && tp["companyId"] == staff["companyId"] && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
        }
    },
    isTravelPolicyAgency: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let tp = await Models.travelPolicy.get(id);
            let company = await Models.company.get(tp["companyId"]);//此处为什么不能用tp.company
            return id && user && company && user["agencyId"] == company["agencyId"];
        }
    },
    isDepartmentAdminOrOwner: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let dept = await Models.department.get(id);
            return id && staff && dept && dept["companyId"] == staff["companyId"] && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
        }
    },
    isDepartmentAgency: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let dept = await Models.department.get(id);
            let company = await Models.company.get(dept["companyId"]);
            return id && user && company && user["agencyId"] == company["agencyId"];
        }
    },
    isCompanyAgency: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let company = await Models.company.get(id);
            return id && user && company && user["agencyId"] == company["agencyId"];
        }
    },
    isCompanyAdminOrOwner: function(idpath: string) {
        return async function (fn ,self, args) {
            let companyId = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            if(companyId){
                let company = await Models.company.get(companyId);
                return companyId && staff && company && staff["companyId"] == company["id"] && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
            }else{
                return staff && staff.company && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
            }
        }
    },
    isMyTripPlan: function(idpath: string) {
        return async function (fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let tripPlan = await Models.tripPlan.get(id);
            return id && staff && tripPlan && staff.id == tripPlan.accountId;
        }
    },
    canGetTripPlan: function (idpath: string) {
        return async function (fn, self, args) {
            let id = _.get(args, idpath);
            let session = Zone.current.get('session');
            
            if(!session) {
                throw L.ERR.PERMISSION_DENIED();
            }
            
            let account = await Models.account.get(session.accountId);
            let tripPlan = await Models.tripPlan.get(id);
            let acc_type = account.type;
            
            if(acc_type == EAccountType.STAFF) {
                let staff = await Models.staff.get(account.id);
                return staff.roleId == EStaffRole.ADMIN || staff.roleId == EStaffRole.OWNER || tripPlan.accountId == account.id;
            }else if(acc_type == EAccountType.AGENCY) {
                let user = await AgencyUser.getCurrent();
                let company = await tripPlan.getCompany();
                let agency = await company.getAgency();
                return agency.id == user.agency.id;
            }else {
                return false;
            }
        }
    }
}
