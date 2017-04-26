'use strict';
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
API.require('airplane');
var airlineCodes = {
    "KN": "联合航空",
    "HO": "吉祥航空",
    "CA": "国际航空",
    "X2": "新华航空",
    "WH": "西北航空",
    "CZ": "南方航空",
    "SZ": "西南航空",
    "CJ": "北方航空",
    "F6": "浙江航空",
    "Z2": "中原航空",
    "HU": "海南航空",
    "2Z": "长安航空",
    "3W": "南京航空",
    "MU": "东方航空",
    "MF": "厦门航空",
    "XO": "新疆航空",
    "3Q": "云南航空",
    "3U": "四川航空",
    "FM": "上海航空",
    "G8": "长城航空",
    "WU": "武汉航空",
    "G4": "贵州航空",
    "ZH": "深圳航空",
    "IV": "福建航空",
    "SC": "山东航空",
    "GS": "天津航空",
    "TV": "西藏航空",
    "AF": "法国航空",
    "AY": "芬兰航空",
    "AZ": "意大利航空",
    "BA": "英国航空",
    "BL": "文莱王家航空",
    "CP": "加拿大国际航空",
    "ET": "埃塞俄比亚航空",
    "E5": "萨马拉航空",
    "GA": "印度尼西亚鹰航空",
    "HY": "乌兹别克斯坦航空",
    "LR": "伊朗航空",
    "JD": "日本航空",
    "JS": "朝鲜航空",
    "KA": "港龙航空",
    "JL": "日本航空",
    "KE": "大韩航空",
    "KL": "荷兰皇家航空",
    "K4": "哈萨克斯坦航空",
    "LH": "德国汉莎航空",
    "LO": "波兰航空",
    "LY": "以色列航空",
    "MH": "马来西亚航空",
    "ML": "新加坡航空",
    "NH": "全日空",
    "NW": "美国西北航空",
    "NX": "澳门航空",
    "OS": "奥地利航空",
    "OZ": "韩亚航空",
    "PK": "巴基斯坦国际航空",
    "PR": "菲律宾航空",
    "QF": "澳大利亚快达航空",
    "QV": "老挝航空",
    "RA": "尼泊尔航空",
    "RO": "罗马尼亚航空",
    "SK": "斯堪的纳维亚（北欧）航空",
    "SQ": "新加坡航空",
    "SU": "瑞士航空",
    "TG": "泰国国际航空",
    "UA": "美国联合航空",
    "UB": "缅甸航空",
    "VJ": "柬埔寨航空",
    "VN": "越南航空"
};
/*
 机票列表页
 * @param $scope
 */
function FlightlistController($scope, $stateParams, $filter, $loading) {
    return __awaiter(this, void 0, void 0, function () {
        //选择日期
        function GetDateStr(AddDayCount) {
            var searchDay = new Date(startDate);
            searchDay.setDate(searchDay.getDate() + AddDayCount);
            return searchDay;
        }
        var budget, startCityName, endCityName, startCityCode, endCityCode, startDate, n, today;
        return __generator(this, function (_a) {
            $loading.start();
            budget = $stateParams.BG;
            startCityName = $stateParams.SCN;
            endCityName = $stateParams.ECN;
            startCityCode = $stateParams.SCC;
            endCityCode = $stateParams.ECC;
            startDate = $stateParams.ST;
            $scope.airlineCodes = airlineCodes;
            $scope.budget = parseInt(budget).toFixed(2);
            $scope.startCityName = startCityName;
            $scope.endCityName = endCityName;
            n = 0;
            $scope.thatDay = startDate;
            //点击前一天
            $scope.prevDay = function () {
                n = n - 1;
                $scope.thatDay = $filter('date')(GetDateStr(n), 'yyyy-MM-dd');
                $loading.start();
                $scope.initFlightlist();
            };
            //点击后一天
            $scope.nextDay = function () {
                n = n + 1;
                $scope.thatDay = $filter('date')(GetDateStr(n), 'yyyy-MM-dd');
                $loading.start();
                $scope.initFlightlist();
            };
            today = new Date();
            $scope.today = $filter('date')(today, 'yyyy-MM-dd');
            //初始化机票列表
            $scope.initFlightlist = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var _a, e_1;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 3, , 4]);
                                return [4 /*yield*/, API.onload()];
                            case 1:
                                _b.sent();
                                _a = $scope;
                                return [4 /*yield*/, API.airplane.get_plane_list({ dept_city: startCityCode, arrival_city: endCityCode, date: $scope.thatDay })];
                            case 2:
                                _a.flightlist = _b.sent();
                                $loading.end();
                                console.info($scope.flightlist);
                                return [3 /*break*/, 4];
                            case 3:
                                e_1 = _b.sent();
                                console.info(e_1);
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                });
            };
            $scope.initFlightlist();
            //排序
            $scope.sort = "suggest_price";
            $scope.sortFunc = function (sort) {
                $scope.sort = sort;
            };
            //筛选
            $scope.shaixuanShow = function () {
                $('.shaixuan_bg').show();
            };
            $scope.shaixuanHide = function () {
                $('.shaixuan_bg').hide();
            };
            $scope.timeList = [
                { st: '00:00', et: '24:00', timeName: '不限' },
                { st: '00:00', et: '06:00', timeName: '00:00 - 06:00' },
                { st: '06:00', et: '12:00', timeName: '06:00 - 12:00' },
                { st: '12:00', et: '18:00', timeName: '12:00 - 18:00' },
                { st: '18:00', et: '24:00', timeName: '18:00 - 24:00' }
            ];
            $scope.cabinList = [
                { cabinLeval: 0, cabinName: '经济舱' },
                { cabinLeval: 6, cabinName: '头等/商务舱' }
            ];
            $scope.airList = [
                { airName: '不限', airCode: '' },
                { airName: '联合航空', airCode: 'KN' },
                { airName: '吉祥航空', airCode: 'HO' },
                { airName: '国际航空', airCode: 'CA' },
                { airName: '新华航空', airCode: 'X2' },
                { airName: '西北航空', airCode: 'WH' },
                { airName: '南方航空', airCode: 'CZ' },
                { airName: '西南航空', airCode: 'SZ' },
                { airName: '北方航空', airCode: 'CJ' },
                { airName: '浙江航空', airCode: 'F6' },
                { airName: '中原航空', airCode: 'Z2' },
                { airName: '海南航空', airCode: 'HU' }
            ];
            //function getFilterFn(queryCondition) {
            //    return function(item) {
            //        var airCompanyCode = queryCondition.airCompanyCode;
            //
            //        //如果有筛选条件出发时间的话,做出发时间筛选
            //        if (queryCondition.startTime1) {
            //            if (item.startTime < queryCondition.startTime1) return false;
            //        }
            //
            //        if (queryCondition.endTime1) {
            //            if (item.startTime > queryCondition.endTime1) return false;
            //        }
            //
            //        if (airCompanyCode) {
            //            var _airCompanyArr = [];
            //            if (typeof airCompanyCode == 'string') {
            //                _airCompanyArr = [airCompanyCode];
            //            } else {
            //                _airCompanyArr = airCompanyCode;
            //            }
            //
            //            if (_airCompanyArr.indexOf(item.airCompanyCode) < 0) {
            //                return false;
            //            }
            //        }
            //
            //
            //        return true;
            //    }
            //}
            //
            //$scope.filterFunc = getFilterFn($scope.condition);
            $scope.selectTab = 'time';
            $scope.tabFunc = function (tabFunc) {
                $scope.selectTab = tabFunc;
            };
            //进入机票详情页
            $scope.enterDetails = function (flight_no, query_key) {
                window.location.href = "#/airticket/flightdetails?BG=" + budget + "&SCN=" + startCityName + "&ECN=" + endCityName + "&flight_no=" + flight_no + "&query_key=" + query_key;
            };
            return [2 /*return*/];
        });
    });
}
exports.FlightlistController = FlightlistController;
/*
 机票详情页
 * @param $scope
 */
function FlightdetailsController($scope, $stateParams) {
    return __awaiter(this, void 0, void 0, function () {
        var budget, startCityName, endCityName, flight_no, query_key, _a, e_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    budget = $stateParams.BG;
                    startCityName = $stateParams.SCN;
                    endCityName = $stateParams.ECN;
                    flight_no = $stateParams.flight_no;
                    query_key = $stateParams.query_key;
                    $scope.budget = parseInt(budget).toFixed(2);
                    $scope.startCityName = startCityName;
                    $scope.endCityName = endCityName;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, API.onload()];
                case 2:
                    _b.sent();
                    _a = $scope;
                    return [4 /*yield*/, API.airplane.get_plane_details({ flight_no: flight_no, query_key: query_key })];
                case 3:
                    _a.flightdetails = _b.sent();
                    console.info($scope.flightdetails);
                    return [3 /*break*/, 5];
                case 4:
                    e_2 = _b.sent();
                    console.info(e_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.FlightdetailsController = FlightdetailsController;
