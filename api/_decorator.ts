/**
 * Created by wlh on 16/5/16.
 */
const API = require("common/api");
const _ = require("lodash");
const L = require("common/language");

export function requirePermit(permits: string| string[], type?: number) {
    return function (target, key, desc) {
        let fn = desc.value;
        desc.value = function (...args) {
            let self = this;
            let session = Zone.current.get("session");
            if (!session["accountId"] || !session["tokenId"]) {
                return Promise.reject(L.ERR.PERMISSION_DENIED);
            }

            let accountId = session["accountId"];
            if (!self) {
                self = {};
            }
            self.accountId = accountId;
            return API.permit.checkPermission({accountId: accountId, permissions: permits, type: type})
                .then(function(ret) {
                    if (!ret) {
                        throw L.ERR.PERMISSION_DENIED
                    }
                    return fn.apply(self, args)
                });
        }
        return desc;
    }
}

interface CheckInterface {
    if: (fn: Function, self: any, args: any) => Promise<boolean>,
    then: (target: Function, string: any, desc: any) => Promise<any>    //then函数直接是decorator函数
}

// class Test2 {
//     @judgeRoleHandle([
//         {"if": isMySelf("0.id"), "then": filterResultColumn(["id", "username"])} as CheckInterface,
//         {"if": isMyCompany("0.id"), "then": filterResultColumn(["password"])} as CheckInterface,
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
// }
//
// Test2.myTest({"id": "2"})
//     .then(function(result) {
//         console.info("函数最终返回值是:", result);
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

export function switchDecorator(checkFnList: CheckInterface[]) {
    return function (target, key, desc) {
        let fn = desc.value;
        desc.value = async function(...args) {
            //在这里才能拿到参数
            let self = this;
            let thenFn;
            for(let checkFn of checkFnList) {
                let ret = await checkFn.if(fn, self, args);
                if (!!ret) {
                    thenFn = checkFn.then;
                    break;
                }
            }
            if(!thenFn) {
                throw new Error("PERMISSION DENY!");
            }
            //判断完if后,将desc还原为原来的函数,否则将引起死循环
            desc.value = fn;
            //self作用于也要一并传过去
            return thenFn(target, key, desc).value.apply(self, args)
        }

        return desc;
    }
}

export function isMySelf(idpath: string) {
    return async function (fn, self, args) {
        let id = _.get(args, idpath);
        let session = Zone.current.get("session");
        return session && session["account"] == id
    }
}

export function isMyCompany(idpath: string) {
    return async function(fn, self, args) {
        let id = _.get(args, idpath);
        let session = Zone.current.get("session");

        let staff = await API.staff.getStaff({id: session["account_id"]});
        return staff && staff["companyId"] == id;
    }
}

export function isMyCompanyAgency(idpath: string) {
    return async function(fn, self, args) {
        let id = _.get(args, idpath);
        let session = Zone.current.get("session");

        let staff = await API.staff.getStaff({id: session["account_id"]});
        if (!staff || !staff["companyId"]) {
            return false;
        }
        let company = await API.company.getCompany({id: staff["companyId"]})
        return company && company.agency == id;
    }
}