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
var os = require("os");
var path = require("path");
var fs = require("fs");
var requestPromise = require("request-promise");
var request = require("request");
var WebRobot = (function () {
    function WebRobot(origin) {
        this.origin = origin;
        this.cookieJar = requestPromise.jar();
        var defaults = {
            jar: this.cookieJar,
            gzip: true,
            resolveWithFullResponse: true,
            headers: {
                'Origin': origin,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
            }
        };
        this.client = requestPromise.defaults(defaults);
        this.client_orig = request.defaults(defaults);
    }
    WebRobot.prototype.getCookie = function (key, uri) {
        uri = uri || this.origin;
        var cookies = this.cookieJar.getCookies(uri);
        for (var _i = 0, cookies_1 = cookies; _i < cookies_1.length; _i++) {
            var cookie = cookies_1[_i];
            if (cookie['key'] === key)
                return cookie['value'];
        }
        return null;
    };
    WebRobot.prototype.downloadFile = function (uri) {
        return __awaiter(this, void 0, void 0, function () {
            var tmpfile;
            return __generator(this, function (_a) {
                tmpfile = path.join(os.tmpdir(), 'webdownload_' + Date.now() + '_' + Math.random());
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        this.client_orig.get({
                            uri: uri
                        })
                            .pipe(fs.createWriteStream(tmpfile))
                            .on('close', function () {
                            resolve(tmpfile);
                        })
                            .on('error', function (err) {
                            reject(err);
                        });
                    })];
            });
        });
    };
    return WebRobot;
}());
exports.WebRobot = WebRobot;
