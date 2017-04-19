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
var travelPolicy_1 = require("_types/travelPolicy");
var msgbox = require('msgbox');
var _ = require("lodash");
function SubsidyTemplatesController($scope, Models, $ionicPopup) {
    return __awaiter(this, void 0, void 0, function () {
        var travelPolicy, removeSubsidyTemplates, saveSubsidyTemplates;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    require('./subsidy-templates.scss');
                    $scope.data = {
                        showDelete: false
                    };
                    // $scope.showDelete = false;
                    if (!$scope.subsidyTemplates) {
                        $scope.subsidyTemplates = [];
                    }
                    removeSubsidyTemplates = [];
                    saveSubsidyTemplates = [];
                    if (!$scope.policyId) return [3 /*break*/, 2];
                    return [4 /*yield*/, Models.travelPolicy.get($scope.policyId)];
                case 1:
                    travelPolicy = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    saveSubsidyTemplates = _.cloneDeep($scope.subsidyTemplates);
                    _a.label = 3;
                case 3:
                    $scope.addTemplate = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                $scope.subsidyTemplate = travelPolicy_1.SubsidyTemplate.create();
                                // $scope.subsidyTemplate.travelPolicy = travelPolicy;
                                $ionicPopup.show({
                                    title: '补助模板',
                                    cssClass: 'subsidyPopup',
                                    template: '<div> <p>模板标题</p> ' +
                                        '<input type="text" placeholder="请输入标题" ng-model="subsidyTemplate.name" maxlength="4"> </div>' +
                                        '<div> <p>补助金额（元/天）</p>' +
                                        '<input type="text" placeholder="请输入金额" ng-model="subsidyTemplate.subsidyMoney" maxlength="5"> </div>',
                                    scope: $scope,
                                    buttons: [
                                        {
                                            text: '取消',
                                            type: 'button-outline button-positive'
                                        },
                                        {
                                            text: '保存',
                                            type: 'button-positive',
                                            onTap: function (e) {
                                                return __awaiter(this, void 0, void 0, function () {
                                                    var re, st;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                if (!$scope.subsidyTemplate.name) {
                                                                    e.preventDefault();
                                                                    msgbox.log("模板标题不能为空");
                                                                    return [2 /*return*/, false];
                                                                }
                                                                if (!$scope.subsidyTemplate.subsidyMoney) {
                                                                    e.preventDefault();
                                                                    msgbox.log("补助金额不能为空");
                                                                    return [2 /*return*/, false];
                                                                }
                                                                re = /^[0-9]+.?[0-9]*$/;
                                                                if (!re.test($scope.subsidyTemplate.subsidyMoney)) {
                                                                    e.preventDefault();
                                                                    msgbox.log("补助金额必须为数字");
                                                                    return [2 /*return*/, false];
                                                                }
                                                                if ($scope.subsidyTemplate.subsidyMoney >= 10000) {
                                                                    e.preventDefault();
                                                                    msgbox.log("补助金额过大");
                                                                    return [2 /*return*/, false];
                                                                }
                                                                if ($scope.subsidyTemplate.subsidyMoney <= 0) {
                                                                    e.preventDefault();
                                                                    msgbox.log("补助金额必须大于0");
                                                                    return [2 /*return*/, false];
                                                                }
                                                                if (!$scope.policyId) return [3 /*break*/, 3];
                                                                return [4 /*yield*/, Models.travelPolicy.get($scope.policyId)];
                                                            case 1:
                                                                travelPolicy = _a.sent();
                                                                $scope.subsidyTemplate.travelPolicy = travelPolicy;
                                                                return [4 /*yield*/, $scope.subsidyTemplate.save()];
                                                            case 2:
                                                                st = _a.sent();
                                                                $scope.subsidyTemplates.push(st);
                                                                console.info(st);
                                                                return [3 /*break*/, 4];
                                                            case 3:
                                                                saveSubsidyTemplates.push($scope.subsidyTemplate);
                                                                $scope.subsidyTemplates.push($scope.subsidyTemplate);
                                                                _a.label = 4;
                                                            case 4: return [2 /*return*/];
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                    ]
                                });
                                return [2 /*return*/];
                            });
                        });
                    };
                    $scope.deleteSt = function (st, index) {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                $ionicPopup.show({
                                    title: '提示',
                                    template: '确认删除该条出差补助么？',
                                    scope: $scope,
                                    buttons: [
                                        {
                                            text: '取消',
                                            type: 'button-outline button-positive'
                                        },
                                        {
                                            text: '确定删除',
                                            type: 'button-positive',
                                            onTap: function () {
                                                return __awaiter(this, void 0, void 0, function () {
                                                    var err_1;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                _a.trys.push([0, 3, , 4]);
                                                                if (!(st && st.id)) return [3 /*break*/, 2];
                                                                return [4 /*yield*/, st.destroy()];
                                                            case 1:
                                                                _a.sent();
                                                                _a.label = 2;
                                                            case 2:
                                                                $scope.subsidyTemplates.splice(index, 1);
                                                                if (!$scope.policyId) {
                                                                    removeSubsidyTemplates.push(st);
                                                                }
                                                                return [3 /*break*/, 4];
                                                            case 3:
                                                                err_1 = _a.sent();
                                                                msgbox.log(err_1.msg);
                                                                return [3 /*break*/, 4];
                                                            case 4: return [2 /*return*/];
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                    ]
                                });
                                return [2 /*return*/];
                            });
                        });
                    };
                    $scope.goBack = function () {
                        var obj = {
                            removeSubsidyTemplates: removeSubsidyTemplates,
                            saveSubsidyTemplates: saveSubsidyTemplates
                        };
                        return $scope.confirmModal(obj);
                    };
                    return [2 /*return*/];
            }
        });
    });
}
exports.SubsidyTemplatesController = SubsidyTemplatesController;
