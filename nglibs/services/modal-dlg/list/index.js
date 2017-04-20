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
var _ = require("lodash");
var msgbox = require('msgbox');
function selectFromListController($scope, $element) {
    return __awaiter(this, void 0, void 0, function () {
        function reloadOptionItems() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, $scope.options.query(form.keyword)];
                        case 1:
                            lists = _a.sent();
                            $scope.optionItems = _.cloneDeep(lists);
                            return [2 /*return*/];
                    }
                });
            });
        }
        var form, lists, page;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    require('./list.scss');
                    if (typeof $scope.options.searchbox === 'undefined') {
                        $scope.options.searchbox = true;
                    }
                    form = $scope.form = {
                        keyword: ''
                    };
                    $scope.optionItems = [];
                    $scope.disableItem = function (item) {
                        if (item && $scope.options && $scope.options.disable) {
                            return $scope.options.disable(item);
                        }
                        return false;
                    };
                    $scope.showCreate = function (keyword) {
                        if ($scope.options.create == undefined)
                            return false;
                        if (!form.keyword || form.keyword.length == 0)
                            return false;
                        var item_elements = $element.find('list-item');
                        var found = false;
                        item_elements.each(function () {
                            if ($(this).text() == form.keyword)
                                found = true;
                        });
                        return !found;
                    };
                    $scope.createItem = function (keyword) {
                        return __awaiter(this, void 0, void 0, function () {
                            var item;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, $scope.options.create(keyword)];
                                    case 1:
                                        item = _a.sent();
                                        $scope.confirm(item);
                                        return [2 /*return*/];
                                }
                            });
                        });
                    };
                    return [4 /*yield*/, reloadOptionItems()];
                case 1:
                    _a.sent();
                    page = {
                        // hasNextPage: function() {
                        //     return lists.hasNextPage();
                        // },
                        nextPage: function () {
                            return __awaiter(this, void 0, void 0, function () {
                                var pager, err_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, 3, 4]);
                                            return [4 /*yield*/, lists.nextPage()];
                                        case 1:
                                            pager = _a.sent();
                                            if (pager) {
                                                pager.map(function (item) {
                                                    $scope.optionItems.push(item);
                                                });
                                            }
                                            return [3 /*break*/, 4];
                                        case 2:
                                            err_1 = _a.sent();
                                            alert("获取数据时,发生异常");
                                            return [2 /*return*/];
                                        case 3:
                                            $scope.$broadcast('scroll.infiniteScrollComplete');
                                            return [7 /*endfinally*/];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            });
                        }
                    };
                    $scope.$watch('form.keyword', function (o, n) {
                        if (o === n)
                            return;
                        reloadOptionItems();
                        if (o) {
                            $scope.hidden = true;
                        }
                        else {
                            $scope.hidden = false;
                        }
                    });
                    $scope.toggle = function () {
                        $scope.hidden = false;
                        $scope.form.keyword = '';
                    };
                    $scope.page = page;
                    $scope.confirm = function (value) {
                        if ($scope.disableItem(value))
                            return value;
                        $scope.confirmModal(value);
                    };
                    return [2 /*return*/];
            }
        });
    });
}
exports.selectFromListController = selectFromListController;
