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
/**
 * Created by chen on 2017/2/13.
 */
var moment = require("moment");
var agency_user_1 = require("_types/agency/agency-user");
var company_1 = require("_types/company/company");
function ListController($scope, Models) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    $scope.query = {
                        userName: '',
                        mobile: '',
                        keyword: '',
                        regDateStart: '',
                        regDateEnd: '',
                        days: '',
                        perPage: 20,
                    };
                    $scope.page = 1;
                    $scope.perPage = 20;
                    $scope.getCompany = function (page, perPage) {
                        return __awaiter(this, void 0, void 0, function () {
                            var _this = this;
                            var agency, query, pager, ps, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, agency_user_1.AgencyUser.getCurrent()];
                                    case 1:
                                        agency = _b.sent();
                                        query = $scope.query || {};
                                        query.page = page || 1;
                                        query.perPage = perPage || 20;
                                        return [4 /*yield*/, agency.findCompanies(query)];
                                    case 2:
                                        pager = _b.sent();
                                        pager.hasNextPage = function () {
                                            return pager.total >= page * perPage;
                                        };
                                        pager.hasPrevPage = function () {
                                            return page > 1;
                                        };
                                        ps = pager.items.map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                                            var company, staff, staffNum, d, days, balance;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, Models.company.get(item.id)];
                                                    case 1:
                                                        company = _a.sent();
                                                        return [4 /*yield*/, Models.staff.get(company.createUser)];
                                                    case 2:
                                                        staff = _a.sent();
                                                        return [4 /*yield*/, company.getStaffNum()];
                                                    case 3:
                                                        staffNum = _a.sent();
                                                        company["staffNum"] = staffNum;
                                                        company['createUserObj'] = staff;
                                                        //剩余有效期天数
                                                        if (!company.expiryDate) {
                                                            company['remainDays'] = Infinity;
                                                        }
                                                        else {
                                                            d = moment();
                                                            days = moment(company.expiryDate).diff(d, 'days');
                                                            company['remainDays'] = days;
                                                        }
                                                        if (!company.coinAccount) {
                                                            company['balance'] = 0;
                                                        }
                                                        else {
                                                            balance = company.coinAccount.balance;
                                                            //行程点数剩余
                                                            // let balance = company.tripPlanNumBalance;
                                                            company['balance'] = balance;
                                                        }
                                                        //是否为试用企业
                                                        if (company.type == company_1.ECompanyType.TRYING) {
                                                            company["trying"] = '试用';
                                                        }
                                                        return [2 /*return*/, company];
                                                }
                                            });
                                        }); });
                                        _a = $scope;
                                        return [4 /*yield*/, Promise.all(ps)];
                                    case 3:
                                        _a.companylist = _b.sent();
                                        $scope.pager = pager;
                                        return [2 /*return*/];
                                }
                            });
                        });
                    };
                    //进入页面自动调用
                    return [4 /*yield*/, $scope.getCompany($scope.page, $scope.query.perPage)];
                case 1:
                    //进入页面自动调用
                    _a.sent();
                    //查询
                    $scope.doSearch = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, $scope.getCompany()];
                            });
                        });
                    };
                    $scope.nextPage = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                $scope.fromIdx = $scope.page * $scope.perPage;
                                $scope.page += 1;
                                return [2 /*return*/, $scope.getCompany($scope.page, $scope.perPage)];
                            });
                        });
                    };
                    $scope.prevPage = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                $scope.page -= 1;
                                $scope.fromIdx = ($scope.page - 1) * $scope.perPage;
                                return [2 /*return*/, $scope.getCompany($scope.page, $scope.perPage)];
                            });
                        });
                    };
                    return [2 /*return*/];
            }
        });
    });
}
exports.ListController = ListController;
