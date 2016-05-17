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
            throw L.ERR.PERMISSION_DENY;
        }
        return desc;
    }
}

export var condition = {
    isMySelf: function (idpath: string) {
        return async function (fn, self, args) {
            let id = _.get(args, idpath);
            let accountId = _getAccountId();
            return id && accountId && id == accountId;
        }
    },
    isMyCompany: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let accountId = _getAccountId();

            let staff = await Models.staff.get(accountId);
            return staff && staff.company.id == id;
        }
    },
    isMyCompanyAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let accountId = _getAccountId();

            let staff = await Models.staff.get(accountId);
            return staff && staff.company && staff.company["agencyId"] == id;
        }
    },
    isMyAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let accountId = _getAccountId();
            let agencyUser = await Models.agencyUser.get(accountId);
            return id && agencyUser && agencyUser["agencyId"] == id;
        }
    },
    isSameCompany: function (idpath:string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let accountId = _getAccountId();

            let [my, other] = await Promise.all([
                Models.staff.get(accountId),
                Models.staff.get(id)
            ]);

            return my && other && my["companyId"] == other["companyId"];
        }
    },
    isSameAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let accountId = _getAccountId();

            let [my, other] = await Promise.all([
                Models.agency.get(accountId),
                Models.agency.get(id)
            ])

            return my && other && my["agencyId"] == other["agencyId"];
        }
    },
    isCompanyAgency: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let accountId = _getAccountId();
            let [agency, company] = await Promise.all([
                Models.agencyUser.get(accountId),
                Models.company.get(id)
            ]);

            return agency && company && agency.id == company["agencyId"];
        }
    }
}

function _getAccountId() {
    let session = Zone.current.get("session");
    return session["accountId"];
}
