/**
 * Created by wlh on 16/5/10.
 */

const API = require("common/api");

//角色名称
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