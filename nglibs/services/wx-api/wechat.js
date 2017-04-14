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
var API = require('common/api');
var dyload = require('dyload');
var browserspec = require('browserspec');
var wxload;
if (browserspec.is_wechat) {
    wxload = dyload("//res.wx.qq.com/open/js/jweixin-1.0.0.js");
}
function wxFunction(funcname) {
    return function (option) {
        return new Promise(function (resolve, reject) {
            option.success = resolve;
            option.fail = reject;
            wx[funcname](option);
        });
    };
}
var wxChooseImage = wxFunction('chooseImage');
var wxUploadImage = wxFunction('uploadImage');
var WechatApi = (function () {
    function WechatApi($rootScope) {
        this.$rootScope = $rootScope;
        this.$resolved = false;
    }
    WechatApi.prototype.$resolve = function () {
        var _this = this;
        if (this.$$promise != undefined)
            return this.$$promise;
        function doResolve() {
            return __awaiter(this, void 0, void 0, function () {
                var url, cfg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            API.require('wechat');
                            return [4 /*yield*/, API.onload()];
                        case 1:
                            _a.sent();
                            url = window.location.href.split('#')[0];
                            return [4 /*yield*/, API.wechat.getJSDKParams({
                                    url: url,
                                    jsApiList: [
                                        'chooseImage',
                                        'uploadImage',
                                        'onMenuShareTimeline',
                                        'onMenuShareAppMessage',
                                        'onMenuShareQQ',
                                        'onMenuShareWeibo',
                                        'onMenuShareQZone',
                                    ],
                                    debug: false
                                })];
                        case 2:
                            cfg = _a.sent();
                            return [4 /*yield*/, wxload];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    wx.error(reject);
                                    wx.ready(resolve);
                                    wx.config(cfg);
                                })];
                    }
                });
            });
        }
        this.$$promise = doResolve()
            .then(function () {
            _this.$resolved = true;
        })
            .catch(function (e) {
            return null;
            //this.$$promise = undefined;
        });
        return this.$$promise;
    };
    WechatApi.prototype.chooseImage = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, wxChooseImage(options || {})];
                    case 1:
                        ret = _a.sent();
                        return [2 /*return*/, ret.localIds];
                }
            });
        });
    };
    WechatApi.prototype.uploadImage = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, wxUploadImage(options || {})];
                    case 1:
                        ret = _a.sent();
                        return [2 /*return*/, ret.serverId];
                }
            });
        });
    };
    WechatApi.prototype.setupSharePrivate = function (options) {
        var _self = this;
        wx.onMenuShareAppMessage({
            title: options.title,
            desc: options.desc,
            link: options.link,
            imgUrl: options.imgUrl,
            success: function () {
                _self.$rootScope.$broadcast('WechatShareSuccessed', 'App');
            },
            cancel: function () {
                _self.$rootScope.$broadcast('WechatShareCanceled', 'App');
            }
        });
        wx.onMenuShareQQ({
            title: options.title,
            desc: options.desc,
            link: options.link,
            imgUrl: options.imgUrl,
            success: function () {
                _self.$rootScope.$broadcast('WechatShareSuccessed', 'QQ');
            },
            cancel: function () {
                _self.$rootScope.$broadcast('WechatShareCanceled', 'QQ');
            }
        });
    };
    WechatApi.prototype.setupSharePublic = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _self;
            return __generator(this, function (_a) {
                _self = this;
                wx.wxShareTimeline({
                    title: options.title,
                    desc: options.desc,
                    link: options.link,
                    imgUrl: options.imgUrl,
                    success: function () {
                        _self.$rootScope.$broadcast('WechatShareSuccessed', 'Timeline');
                    },
                    cancel: function () {
                        _self.$rootScope.$broadcast('WechatShareCanceled', 'Timeline');
                    }
                });
                wx.onMenuShareWeibo({
                    title: options.title,
                    desc: options.desc,
                    link: options.link,
                    imgUrl: options.imgUrl,
                    success: function () {
                        _self.$rootScope.$broadcast('WechatShareSuccessed', 'Weibo');
                    },
                    cancel: function () {
                        _self.$rootScope.$broadcast('WechatShareCanceled', 'Weibo');
                    }
                });
                wx.onMenuShareQZone({
                    title: options.title,
                    desc: options.desc,
                    link: options.link,
                    imgUrl: options.imgUrl,
                    success: function () {
                        _self.$rootScope.$broadcast('WechatShareSuccessed', 'QZone');
                    },
                    cancel: function () {
                        _self.$rootScope.$broadcast('WechatShareCanceled', 'QZone');
                    }
                });
                return [2 /*return*/];
            });
        });
    };
    WechatApi.prototype.isInstalled = function () {
        return false;
    };
    return WechatApi;
}());
exports.WechatApi = WechatApi;
