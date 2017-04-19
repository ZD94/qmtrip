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
var msgbox = require('msgbox');
var browserspec = require('browserspec');
var WechatCordovaApi = (function () {
    function WechatCordovaApi($ionicPlatform) {
        this.$ionicPlatform = $ionicPlatform;
        this.$resolved = false;
        this.successCbs = [];
        this.cancelCbs = [];
    }
    WechatCordovaApi.prototype.$resolve = function () {
        var _this = this;
        if (this.$$promise != undefined)
            return this.$$promise;
        this.$$promise = this.$ionicPlatform.ready()
            .then(function () {
            _this.$resolved = true;
        })
            .catch(function (e) {
            return null;
            //this.$$promise = undefined;
        });
        return this.$$promise;
    };
    WechatCordovaApi.prototype.on = function (type, fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (type == 'success')
                    this.successCbs.push(fn);
                else
                    this.cancelCbs.push(fn);
                return [2 /*return*/];
            });
        });
    };
    WechatCordovaApi.prototype.chooseImage = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    WechatCordovaApi.prototype.uploadImage = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ''];
            });
        });
    };
    WechatCordovaApi.prototype.setupSharePrivate = function (options, scene) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                params = {
                    message: {},
                    scene: Wechat.Scene.SESSION //发送给朋友
                };
                params.message = {
                    title: options.title,
                    description: options.desc,
                    thumb: options.imgUrl,
                    mediaTagName: options.mediaTagName,
                    messageExt: options.messageExt,
                    messageAction: options.messageAction,
                    media: {
                        type: Wechat.Type.WEBPAGE,
                        webpageUrl: options.link
                    }
                };
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        return Wechat.share(params, function () {
                            msgbox.log('分享成功');
                        }, function (reason) {
                            msgbox.log('分享失败:' + reason);
                        });
                    })];
            });
        });
    };
    WechatCordovaApi.prototype.setupSharePublic = function (options, scene) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                params = {
                    message: {},
                    scene: Wechat.Scene.TIMELINE //分享到朋友圈
                };
                params.message = {
                    title: options.title,
                    description: options.desc,
                    thumb: options.imgUrl,
                    mediaTagName: options.mediaTagName,
                    messageExt: options.messageExt,
                    messageAction: options.messageAction,
                    media: {
                        type: Wechat.Type.WEBPAGE,
                        webpageUrl: options.link
                    }
                };
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        return Wechat.share(params, function (result) {
                            alert('分享成功');
                        }, function (err) {
                            alert('分享失败' + err);
                        });
                    })];
            });
        });
    };
    // async authWechat() {
    //     var state = "_" + (+new Date());
    //     var options = {
    //         scope: 'snsapi_userinfo',
    //         state: state
    //     }
    //
    //     // let ret = await auth(options);
    //     // return ret;
    //     return null;
    // }
    WechatCordovaApi.prototype.isInstalled = function () {
        return new Promise(function (resolve, reject) {
            return Wechat.isInstalled(resolve, reject); //检验手机中是否安装微信app
        });
    };
    return WechatCordovaApi;
}());
exports.WechatCordovaApi = WechatCordovaApi;
