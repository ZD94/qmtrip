"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var API = require('@jingli/dnode-api');
var dyload = require('dyload');
var ddtalkLoad;
function isDingTalk() {
    return !!window['ddtalk'];
}
if (isDingTalk()) {
    ddtalkLoad = dyload("https://g.alicdn.com/ilw/ding/0.9.2/scripts/dingtalk.js");
}
angular
    .module('nglibs')
    .factory('ddtalkApi', function () {
    if (!isDingTalk()) {
        return {
            $resolve: function () {
                return Promise.resolve();
            }
        };
    }
    return new DDTalkApi();
});
var DDTalkApi = (function () {
    function DDTalkApi() {
        this.$resolved = false;
    }
    DDTalkApi.prototype.$resolve = function () {
        var _this = this;
        if (this.$promise != undefined) {
            return this.$promise;
        }
        function doResolve() {
            return __awaiter(this, void 0, void 0, function () {
                var url, orgid, cfg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!isDingTalk()) {
                                throw new Error("不在钉钉客户端");
                            }
                            API.require('ddtalk');
                            return [4 /*yield*/, API.onload()];
                        case 1:
                            _a.sent();
                            url = window.location.href.split('#')[0];
                            orgid = window['ddtalk'].getCorpid();
                            return [4 /*yield*/, API.ddtalk.getJSAPIConfig({
                                    url: url,
                                    orgid: orgid,
                                })];
                        case 2:
                            cfg = _a.sent();
                            cfg.jsApiList = [
                                'runtime.info',
                                'biz.contact.choose',
                                'device.notification.confirm',
                                'device.notification.alert',
                                'device.notification.prompt',
                                'biz.ding.post',
                                'biz.util.openLink',
                                'biz.user.get',
                                'runtime.permission.requestAuthCode',
                                'device.base.getInterface',
                                'device.base.getUUID',
                                'biz.util.scan',
                            ]; // 必填，需要使用的jsapi列表，注意：不要带dd。
                            return [4 /*yield*/, ddtalkLoad];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    dd.error(reject);
                                    dd.config(cfg);
                                    dd.ready(resolve);
                                })];
                    }
                });
            });
        }
        this.$promise = doResolve()
            .then(function () {
            _this.$resolved = true;
        })
            .catch(function (err) {
            console.error(err);
            return null;
        });
        return this.$promise;
    };
    return DDTalkApi;
}());
