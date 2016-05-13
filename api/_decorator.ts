/**
 * Created by wlh on 16/5/10.
 */

const API = require("common/api");
const _ = require("lodash");

export function requirePermit(permits: string| string[], type?: number) {
    return function (target, key, desc) {
        let errMsg = `{"code": 403, "msg":"permit deny!"}`
        let self = this;
        let fn = desc.value;
        desc.value = function () {
            let args = arguments;
            let session = Zone.current.get("session");
            if (!session["accountId"] || !session["tokenId"]) {
                return Promise.reject(errMsg);
            }

            let accountId = session["accountId"];
            if (!self) {
                self = {};
            }
            self.accountId = accountId;
            return API.permit.checkPermission({accountId: accountId, permissions: permits, type: type})
                .then(function(ret) {
                    if (!ret) {
                        throw new Error(errMsg);
                    }
                    return fn.apply(self, args)
                });
        }
        return desc;
    }
}

function filterColumns(keys: string[]) {
    return function (originFunc, self, args) {
        return originFunc.apply(self, args)
            .then(function(result) {
                //handle filter column
                if (keys.indexOf("*") >= 0) {
                    return result;
                }
                
                for(let _key of result) {
                    if (keys.indexOf(_key) < 0) {
                        delete result[_key];
                    }
                }
                return result;
            })
    }
}

function isSelf(idpath: string, func: any) {
    return function(origin, self, args) {
        let id = _.get(args, idpath);
        let session = Zone.current.get("session");
        let resolved = false;
        let result = null;
        if (session["accountId"] == id) {
            resolved = true;
        }

        if (resolved) {
            result = func(origin, self, args);
        }
        return {resolved: resolved, result: result};
    }
}

function isSameCompany(idpath, func) {
    return function(origin, self, args) {
        let id = _.get(args, idpath);
        let session = Zone.current.get("session");
        let accountId = session["accountId"];
        let resolved = false;
        let result = null;

        //是否同一个公司
        return Promise.all([
                API.staff.getStaff(accountId),
                API.staff.getStaff(id),
            ])
            .spread(function(currentStaff, queryStaff) {
                if (currentStaff["companyId"] == queryStaff["companyId"]) {
                    resolved = true;
                    result = func(origin, self, args);
                }

                return {resolved: resolved, result: result};
            })
    }
}

function isCompanyAgency(idpath, func) {
    return function(origin, self, args) {
        let id = _.get(args, idpath);
        let session = Zone.current.get("session");
        let accountId = session["accountId"];
        let resolved = false;
        let result = null;
        //是否是代理商
        //是否代理商关系
        return Promise.all([
            API.agency.getAgencyUser({id: accountId}),
            API.staff.getStaff({id: id})
                .then(function(staff) {
                    return API.company.getCompany({companyId: staff["companyId"]})
                })
        ])
        .spread(function(agencyUser, company) {
            if (agencyUser.agencyId == company.agencyId) {
                resolved = true;
                result = func(origin, self, args);
            }
            return {resolved: resolved, result: result};
        })
    }
}

// interface FilterFunc {
//     (idpath: string, func: Function): Promise<any>
// }

export function judgeRoleHandle(roleList: any[]) {

    return async function(target, funcname, desc) {
        let self = this;
        let args = arguments;

        for(let roleCheck of roleList) {
            let {resolved, result} = await roleCheck(target[funcname], self, args);
            if (resolved) {
                return result;
            }
        }
        throw new Error(`{"code": 403, "msg": "Permit Deny!"}`);
    }
}