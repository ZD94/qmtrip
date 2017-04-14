/**
 * Created by seven on 2017/3/7.
 */
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
var jquery = require('jquery');
var _ = require("lodash");
function selectCityListController($scope, $storage, $ionicScrollDelegate) {
    return __awaiter(this, void 0, void 0, function () {
        var history, _a, abroadIdx, domesticIdx;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    require("./dialog.scss");
                    $scope.searchBegin = false;
                    $scope.abroadCities = []; //所有国际城市数据
                    $scope.domesticCities = []; //所有国内城市数据
                    return [4 /*yield*/, $storage.local.get('history_city')];
                case 1:
                    history = _b.sent();
                    if (history) {
                        $scope.history_city = history;
                    }
                    else {
                        $scope.history_city = [];
                    }
                    $scope.isAbroad = false;
                    _a = $scope;
                    return [4 /*yield*/, $scope.options.queryAll(null, $scope.isAbroad)];
                case 2:
                    _a.keyList = _b.sent();
                    $scope.hotCities = $scope.keyList.slice(0, 10);
                    abroadIdx = 0;
                    domesticIdx = 0;
                    $scope.checkAbroad = function (abroad) {
                        return __awaiter(this, void 0, void 0, function () {
                            var _a, abroadCities, _b, top_1, abroad_1, _c, domesticCities, _d, intertop_1, domestic;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        $scope.abroadlist = [];
                                        $scope.domesticlist = [];
                                        abroadIdx = 0;
                                        domesticIdx = 0;
                                        if (!abroad) return [3 /*break*/, 3];
                                        //这里获取国际列表
                                        $scope.isAbroad = true;
                                        _a = $scope;
                                        return [4 /*yield*/, $scope.options.queryAll(null, $scope.isAbroad)];
                                    case 1:
                                        _a.keyList = _e.sent();
                                        $scope.hotCities = $scope.keyList.slice(0, 10);
                                        $ionicScrollDelegate.scrollTop();
                                        _b = $scope;
                                        return [4 /*yield*/, $scope.options.queryAbroad()];
                                    case 2:
                                        abroadCities = _b.abroadCities = _e.sent();
                                        $scope.pages.getCityList(abroadCities);
                                        top_1 = 0;
                                        abroad_1 = [];
                                        abroad_1 = abroadCities.map(function (city, idx) {
                                            city.top = { top: top_1 + 'px' };
                                            top_1 = top_1 + 20 + city.cities.length * 41;
                                            return city;
                                        });
                                        return [3 /*break*/, 6];
                                    case 3:
                                        //这里获取国内列表
                                        $scope.isAbroad = false;
                                        _c = $scope;
                                        return [4 /*yield*/, $scope.options.queryAll(null, abroad)];
                                    case 4:
                                        _c.keyList = _e.sent();
                                        $scope.hotCities = $scope.keyList.slice(0, 10);
                                        $ionicScrollDelegate.scrollTop();
                                        _d = $scope;
                                        return [4 /*yield*/, $scope.options.queryDomestic()];
                                    case 5:
                                        domesticCities = _d.domesticCities = _e.sent();
                                        $scope.pages.getCityList(domesticCities);
                                        intertop_1 = 0;
                                        domestic = [];
                                        domestic = domesticCities.map(function (city, idx) {
                                            city.top = { top: intertop_1 + 'px' };
                                            intertop_1 = intertop_1 + 20 + city.cities.length * 41;
                                            return city;
                                        });
                                        _e.label = 6;
                                    case 6: return [2 /*return*/];
                                }
                            });
                        });
                    };
                    $scope.checkAbroad($scope.isAbroad);
                    $scope.pages = {
                        hasNextIndex: function () {
                            if ($scope.isAbroad) {
                                return $scope.abroadCities.length - abroadIdx;
                            }
                            else {
                                return $scope.domesticCities.length - domesticIdx;
                            }
                        },
                        getCityList: function (list) {
                            list.sort(function (pre, current) {
                                return pre.first_letter.charCodeAt(0) - current.first_letter.charCodeAt(0);
                            });
                            if ($scope.isAbroad) {
                                var total = 0;
                                while (list && list.length && total < 50) {
                                    if (!$scope.abroadlist) {
                                        $scope.abroadlist = list[abroadIdx];
                                    }
                                    else {
                                        $scope.abroadlist = _.concat($scope.abroadlist, list[abroadIdx]);
                                    }
                                    total += list[abroadIdx].cities.length;
                                    abroadIdx++;
                                    if (abroadIdx >= list.length)
                                        break;
                                }
                            }
                            else {
                                var total = 0;
                                while (list && list.length && total < 50) {
                                    if (!$scope.domesticlist) {
                                        $scope.domesticlist = list[domesticIdx];
                                    }
                                    else {
                                        $scope.domesticlist = _.concat($scope.domesticlist, list[domesticIdx]);
                                    }
                                    total += list[domesticIdx].cities.length;
                                    domesticIdx++;
                                    if (domesticIdx >= list.length)
                                        break;
                                }
                            }
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                    };
                    $scope.confirm = function (value) {
                        return __awaiter(this, void 0, void 0, function () {
                            var MAX_HISTORY_LENGTH, i, ii, city;
                            return __generator(this, function (_a) {
                                MAX_HISTORY_LENGTH = 5;
                                if (!history) {
                                    history = [];
                                }
                                for (i = 0, ii = history.length; i < ii; i++) {
                                    city = history[i];
                                    if (city && city.id == value.id) {
                                        history.splice(i, 1);
                                    }
                                }
                                history.unshift(value);
                                while (history.length > MAX_HISTORY_LENGTH) {
                                    history.pop();
                                }
                                $storage.local.set('history_city', history);
                                $scope.confirmModal(value);
                                return [2 /*return*/];
                            });
                        });
                    };
                    $scope.queryCity = function (keyword) {
                        return __awaiter(this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = $scope;
                                        return [4 /*yield*/, $scope.options.queryAll(keyword)];
                                    case 1:
                                        _a.keyList = _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    };
                    $scope.showSearchList = function () {
                        $scope.searchBegin = true;
                    };
                    $scope.hideSearchList = function () {
                        $scope.searchBegin = false;
                    };
                    return [2 /*return*/];
            }
        });
    });
}
exports.selectCityListController = selectCityListController;
