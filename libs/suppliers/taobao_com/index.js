"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var moment = require("moment");
var index_1 = require("../index");
var language_1 = require("@jingli/language");
var CityCodes = require("./cityCode.json");
var iconv = require('iconv-lite');
var SupplierCtripCT = (function (_super) {
    __extends(SupplierCtripCT, _super);
    function SupplierCtripCT() {
        return _super.call(this, 'https://touch.qunar.com/h5') || this;
    }
    SupplierCtripCT.prototype.login = function (authDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw language_1.default.ERR.NOT_IMPLEMENTED();
            });
        });
    };
    SupplierCtripCT.prototype.getOrderList = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw language_1.default.ERR.NOT_IMPLEMENTED();
            });
        });
    };
    SupplierCtripCT.prototype.getBookLink = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var reserveType, bookLink;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reserveType = options.reserveType;
                        bookLink = {};
                        if (!(reserveType == "travel_plane")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAirTicketReserveLink({ fromCity: options.fromCity, toCity: options.toCity, leaveDate: options.leaveDate })];
                    case 1:
                        bookLink = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!(reserveType == "travel_train")) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getTrainTicketReserveLink({ fromCity: options.fromCity, toCity: options.toCity, leaveDate: options.leaveDate })];
                    case 3:
                        bookLink = _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!(reserveType == "hotel")) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.getHotelReserveLink(options)];
                    case 5:
                        bookLink = _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, bookLink];
                }
            });
        });
    };
    SupplierCtripCT.prototype.getAirTicketReserveLink = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var startStation, endStation, date, link, jsCode;
            return __generator(this, function (_a) {
                startStation = encodeURI(options.fromCity), endStation = encodeURI(options.toCity), date = moment(options.leaveDate).format("YYYY-MM-DD");
                link = "https://h5.m.taobao.com/trip/flight/search/index.html";
                jsCode = "\n            var isIn = sessionStorage.getItem(\"isIn\");\n            if(isIn){\n                \n            }else{\n                sessionStorage.setItem(\"isIn\", true);\n                localStorage.setItem(\"depCity\" , \"" + options.fromCity + "\");\n                localStorage.setItem(\"arrCity\" , \"" + options.toCity + "\");\n                var ele = document.getElementById(\"J_depDate\");\n                ele.value = \"" + date + "\";\n                var searchBtn = document.getElementById(\"J_SearchSubmitBtn\");\n                if(searchBtn){\n                    setTimeout(function(){\n                        searchBtn.click();\n                    } , 500);\n                }\n            }\n        ";
                return [2 /*return*/, { url: link, jsCode: jsCode }];
            });
        });
    };
    SupplierCtripCT.prototype.getHotelReserveLink = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var city, checkInDate, checkOutDate, cityCode, link;
            return __generator(this, function (_a) {
                city = encodeURI(options.city), checkInDate = moment(options.leaveDate).format("YYYY-MM-DD"), checkOutDate = moment(options.backDate).format("YYYY-MM-DD"), cityCode = CityCodes[options.city];
                if (cityCode) {
                    cityCode = cityCode.code;
                }
                else {
                    cityCode = 110100;
                }
                link = "https://h5.m.taobao.com/trip/hotel/searchlist/index.html?cityCode=" + cityCode + "&cityName=" + city + "&checkIn=" + checkInDate + "&checkOut=" + checkOutDate;
                return [2 /*return*/, { url: link, jsCode: '' }];
            });
        });
    };
    SupplierCtripCT.prototype.getTrainTicketReserveLink = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var startStation, endStation, date, trafficBookLink;
            return __generator(this, function (_a) {
                startStation = encodeURI(options.fromCity), endStation = encodeURI(options.toCity), date = moment(options.leaveDate).format("YYYY-MM-DD");
                trafficBookLink = "https://h5.m.taobao.com/trip/train/searchlist/index.html?depCity=" + startStation + "&arrCity=" + endStation + "&depDate=" + date;
                return [2 /*return*/, { url: trafficBookLink, jsCode: '' }];
            });
        });
    };
    return SupplierCtripCT;
}(index_1.SupplierWebRobot));
exports.default = SupplierCtripCT;
