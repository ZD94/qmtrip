/**
 * Created by wlh on 16/5/10.
 */

const API = require("common/api");

//角色名称
export function requirePermit(permits: string| string[], type?: number) {
    return function preCheckPermit(target, key, desc) {
        let self = this;
        let fn = desc.value;
        desc.value = function () {
            let args = arguments;
            let session = Zone.current.get("session");
            if (!session["accountId"] || !session["tokenId"]) {
                return Promise.reject(`{"code": 403, "msg":"permit deny!"}`);
            }

            let accountId = session["accountId"];
            return API.permit.checkPermission({accountId: accountId, permissions: permits, type: type})
                .then(fn.call(self, args));
        }
        return desc;
    }
}