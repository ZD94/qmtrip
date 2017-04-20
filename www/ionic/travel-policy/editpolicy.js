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
var staff_1 = require("_types/staff/staff");
var travelPolicy_1 = require("_types/travelPolicy");
var subsidy_templates_1 = require("./subsidy-templates");
var msgbox = require('msgbox');
function EditpolicyController($scope, Models, $stateParams, $ionicHistory, $ionicPopup, ngModalDlg, $window) {
    return __awaiter(this, void 0, void 0, function () {
        var hotelLevels, staff, travelPolicy, subsidyTemplates, policyId, saveSubsidyTemplates, removeSubsidyTemplates, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    require('./editpolicy.scss');
                    $scope.travelPolicy = {};
                    $scope.planeLevels = [
                        { name: travelPolicy_1.MPlaneLevel[travelPolicy_1.EPlaneLevel.ECONOMY], value: travelPolicy_1.EPlaneLevel.ECONOMY },
                        { name: travelPolicy_1.MPlaneLevel[travelPolicy_1.EPlaneLevel.FIRST], value: travelPolicy_1.EPlaneLevel.FIRST },
                        { name: travelPolicy_1.MPlaneLevel[travelPolicy_1.EPlaneLevel.BUSINESS], value: travelPolicy_1.EPlaneLevel.BUSINESS },
                        { name: travelPolicy_1.MPlaneLevel[travelPolicy_1.EPlaneLevel.PREMIUM_ECONOMY], value: travelPolicy_1.EPlaneLevel.PREMIUM_ECONOMY }
                    ];
                    $scope.planeValue = [];
                    $scope.trainLevels = [
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.BUSINESS_SEAT], value: travelPolicy_1.ETrainLevel.BUSINESS_SEAT },
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.FIRST_SEAT], value: travelPolicy_1.ETrainLevel.FIRST_SEAT },
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.SECOND_SEAT], value: travelPolicy_1.ETrainLevel.SECOND_SEAT },
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.PRINCIPAL_SEAT], value: travelPolicy_1.ETrainLevel.PRINCIPAL_SEAT },
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.SENIOR_SOFT_SLEEPER], value: travelPolicy_1.ETrainLevel.SENIOR_SOFT_SLEEPER },
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.SOFT_SLEEPER], value: travelPolicy_1.ETrainLevel.SOFT_SLEEPER },
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.HARD_SLEEPER], value: travelPolicy_1.ETrainLevel.HARD_SLEEPER },
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.SOFT_SEAT], value: travelPolicy_1.ETrainLevel.SOFT_SEAT },
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.HARD_SEAT], value: travelPolicy_1.ETrainLevel.HARD_SEAT },
                        { name: travelPolicy_1.MTrainLevel[travelPolicy_1.ETrainLevel.NO_SEAT], value: travelPolicy_1.ETrainLevel.NO_SEAT }
                    ];
                    $scope.trainValue = [];
                    hotelLevels = $scope.hotelLevels = [
                        { name: '国际五星', value: travelPolicy_1.EHotelLevel.FIVE_STAR, desc1: '万丽、喜来登 ', desc2: '希尔顿、皇冠假日等' },
                        { name: '高端商务', value: travelPolicy_1.EHotelLevel.FOUR_STAR, desc1: '福朋喜来登、诺富特、希尔顿逸林', desc2: '豪生、Holiday Inn、开元名都等' },
                        { name: '精品连锁', value: travelPolicy_1.EHotelLevel.THREE_STAR, desc1: '如家精选、和颐酒店、全季酒店、', desc2: '桔子水晶、智选假日、ZMAX等' },
                        { name: '快捷连锁', value: travelPolicy_1.EHotelLevel.TWO_STAR, desc1: '如家、莫泰168、汉庭', desc2: '速8、锦江之星、IBIS等' },
                    ];
                    $scope.hotelValue = [];
                    $scope.abroadPlaneLevels = [
                        { name: travelPolicy_1.MPlaneLevel[travelPolicy_1.EPlaneLevel.ECONOMY], value: travelPolicy_1.EPlaneLevel.ECONOMY },
                        { name: travelPolicy_1.MPlaneLevel[travelPolicy_1.EPlaneLevel.FIRST], value: travelPolicy_1.EPlaneLevel.FIRST },
                        { name: travelPolicy_1.MPlaneLevel[travelPolicy_1.EPlaneLevel.BUSINESS], value: travelPolicy_1.EPlaneLevel.BUSINESS },
                        { name: travelPolicy_1.MPlaneLevel[travelPolicy_1.EPlaneLevel.PREMIUM_ECONOMY], value: travelPolicy_1.EPlaneLevel.PREMIUM_ECONOMY }
                    ];
                    $scope.abroadPlaneValue = [];
                    $scope.abroadHotelLevels = [
                        { name: '国际五星', value: travelPolicy_1.EHotelLevel.FIVE_STAR, desc1: '万丽、喜来登 ', desc2: '希尔顿、皇冠假日等' },
                        { name: '高端商务', value: travelPolicy_1.EHotelLevel.FOUR_STAR, desc1: '福朋喜来登、诺富特、希尔顿逸林', desc2: '豪生、Holiday Inn、开元名都等' },
                        { name: '精品连锁', value: travelPolicy_1.EHotelLevel.THREE_STAR, desc1: 'Comfort Inn、和颐酒店、全季酒店、', desc2: '桔子水晶、智选假日、ZMAX等' },
                        { name: '快捷连锁', value: travelPolicy_1.EHotelLevel.TWO_STAR, desc1: 'Green Hotel', desc2: 'Super8、IBIS等' },
                    ];
                    $scope.abroadHotelValue = [];
                    return [4 /*yield*/, staff_1.Staff.getCurrent()];
                case 1:
                    staff = _b.sent();
                    policyId = $stateParams.policyId;
                    saveSubsidyTemplates = [];
                    removeSubsidyTemplates = [];
                    $scope.subsidyTemplates = [];
                    if (!$stateParams.policyId) return [3 /*break*/, 4];
                    return [4 /*yield*/, Models.travelPolicy.get($stateParams.policyId)];
                case 2:
                    travelPolicy = _b.sent();
                    Models.resetOnPageChange(travelPolicy);
                    _a = $scope;
                    return [4 /*yield*/, travelPolicy.getSubsidyTemplates()];
                case 3:
                    _a.subsidyTemplates = subsidyTemplates = _b.sent();
                    subsidyTemplates.forEach(function (sub) { return Models.resetOnPageChange(sub); });
                    return [3 /*break*/, 5];
                case 4:
                    travelPolicy = travelPolicy_1.TravelPolicy.create();
                    travelPolicy.companyId = staff.company.id;
                    travelPolicy.planeLevels = [travelPolicy_1.EPlaneLevel.ECONOMY];
                    travelPolicy.trainLevels = [travelPolicy_1.ETrainLevel.SECOND_SEAT];
                    travelPolicy.hotelLevels = [travelPolicy_1.EHotelLevel.TWO_STAR];
                    _b.label = 5;
                case 5:
                    $scope.travelPolicy = travelPolicy;
                    $scope.savePolicy = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var policy, re, travelPolicy, err_1, _i, saveSubsidyTemplates_1, v, _a, removeSubsidyTemplates_1, v, viewHistory, backView, backUrl;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        policy = $scope.travelPolicy;
                                        if (!policy.name) {
                                            msgbox.log("标准名称不能为空");
                                            return [2 /*return*/, false];
                                        }
                                        if (!policy.planeLevels || policy.planeLevels.length <= 0) {
                                            msgbox.log('飞机舱位不能为空');
                                            return [2 /*return*/, false];
                                        }
                                        if (!policy.trainLevels || policy.trainLevels.length <= 0) {
                                            msgbox.log('火车座次不能为空');
                                            return [2 /*return*/, false];
                                        }
                                        if (!policy.hotelLevels || policy.hotelLevels.length <= 0) {
                                            msgbox.log('住宿标准不能为空');
                                            return [2 /*return*/, false];
                                        }
                                        if (policy.isOpenAbroad) {
                                            if (!policy.abroadPlaneLevels || policy.abroadPlaneLevels.length <= 0) {
                                                msgbox.log('国际飞机舱位不能为空');
                                                return [2 /*return*/, false];
                                            }
                                            if (!policy.abroadHotelLevels || policy.abroadHotelLevels.length <= 0) {
                                                msgbox.log('国际住宿标准不能为空');
                                                return [2 /*return*/, false];
                                            }
                                        }
                                        re = /^[0-9]+.?[0-9]*$/;
                                        if ($scope.travelPolicy.subsidy && !re.test($scope.travelPolicy.subsidy)) {
                                            msgbox.log("补助必须为数字");
                                            return [2 /*return*/, false];
                                        }
                                        if (!policyId) {
                                            $scope.travelPolicy.company = staff.company;
                                        }
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, $scope.travelPolicy.save()];
                                    case 2:
                                        travelPolicy = _b.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        err_1 = _b.sent();
                                        msgbox.log(err_1.msg);
                                        return [2 /*return*/, false];
                                    case 4:
                                        _i = 0, saveSubsidyTemplates_1 = saveSubsidyTemplates;
                                        _b.label = 5;
                                    case 5:
                                        if (!(_i < saveSubsidyTemplates_1.length)) return [3 /*break*/, 8];
                                        v = saveSubsidyTemplates_1[_i];
                                        v.travelPolicy = travelPolicy;
                                        return [4 /*yield*/, v.save()];
                                    case 6:
                                        _b.sent();
                                        _b.label = 7;
                                    case 7:
                                        _i++;
                                        return [3 /*break*/, 5];
                                    case 8:
                                        _a = 0, removeSubsidyTemplates_1 = removeSubsidyTemplates;
                                        _b.label = 9;
                                    case 9:
                                        if (!(_a < removeSubsidyTemplates_1.length)) return [3 /*break*/, 12];
                                        v = removeSubsidyTemplates_1[_a];
                                        if (!(v && v.id)) return [3 /*break*/, 11];
                                        return [4 /*yield*/, v.destroy()];
                                    case 10:
                                        _b.sent();
                                        _b.label = 11;
                                    case 11:
                                        _a++;
                                        return [3 /*break*/, 9];
                                    case 12:
                                        viewHistory = $ionicHistory.viewHistory();
                                        backView = viewHistory.backView;
                                        backUrl = backView.url;
                                        if (backUrl == "/travel-policy/") {
                                            console.log(1);
                                            $ionicHistory.goBack(-1);
                                        }
                                        else if ((backUrl.substr(0, backUrl.indexOf('?'))) == "/travel-policy/showpolicy") {
                                            console.log(2);
                                            $window.history.go(-1);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        });
                    };
                    $scope.selectHotalLevel = {
                        searchbox: false,
                        query: function () { return [5, 4, 3, 2]; },
                        display: function (val) {
                            for (var _i = 0, hotelLevels_1 = hotelLevels; _i < hotelLevels_1.length; _i++) {
                                var level = hotelLevels_1[_i];
                                if (level.value === val) {
                                    return level.name;
                                }
                            }
                        },
                        note: function (val) {
                            for (var _i = 0, hotelLevels_2 = hotelLevels; _i < hotelLevels_2.length; _i++) {
                                var level = hotelLevels_2[_i];
                                if (level.value === val) {
                                    return level.desc1;
                                }
                            }
                        }
                    };
                    $scope.deletePolicy = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            function deleteFailed() {
                                $ionicPopup.show({
                                    title: '删除失败',
                                    template: '还有员工在使用该标准，请先移除',
                                    scope: $scope,
                                    buttons: [
                                        {
                                            text: '确认',
                                            type: 'button-positive',
                                            onTap: function () {
                                                return __awaiter(this, void 0, void 0, function () {
                                                    return __generator(this, function (_a) {
                                                        return [2 /*return*/];
                                                    });
                                                });
                                            }
                                        }
                                    ]
                                });
                            }
                            return __generator(this, function (_a) {
                                $ionicPopup.show({
                                    title: '提示',
                                    template: '确定要删除该条差旅标准么?',
                                    scope: $scope,
                                    buttons: [
                                        {
                                            text: '取消'
                                        },
                                        {
                                            text: '确认删除',
                                            type: 'button-positive',
                                            onTap: function () {
                                                return __awaiter(this, void 0, void 0, function () {
                                                    var result, err_2;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                _a.trys.push([0, 3, , 4]);
                                                                return [4 /*yield*/, $scope.travelPolicy.getStaffs()];
                                                            case 1:
                                                                result = _a.sent();
                                                                if (result && result.length > 0) {
                                                                    throw { code: -1, msg: '还有' + result.total + '位员工在使用该标准' };
                                                                }
                                                                return [4 /*yield*/, $scope.travelPolicy.destroy()];
                                                            case 2:
                                                                _a.sent();
                                                                /*window.location.href = '#/travel-policy/index'*/
                                                                $ionicHistory.goBack(-2);
                                                                return [3 /*break*/, 4];
                                                            case 3:
                                                                err_2 = _a.sent();
                                                                if (err_2.code == -1) {
                                                                    deleteFailed();
                                                                }
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
                    $scope.subsidyTemplateList = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var obj;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, ngModalDlg.createDialog({
                                            parent: $scope,
                                            scope: { subsidyTemplates: subsidyTemplates, policyId: policyId },
                                            template: require('./subsidy-templates.html'),
                                            controller: subsidy_templates_1.SubsidyTemplatesController
                                        })];
                                    case 1:
                                        obj = _a.sent();
                                        saveSubsidyTemplates = obj.saveSubsidyTemplates;
                                        if (!$stateParams.policyId) {
                                            $scope.subsidyTemplates = subsidyTemplates = obj.saveSubsidyTemplates;
                                        }
                                        removeSubsidyTemplates = obj.removeSubsidyTemplates;
                                        return [2 /*return*/];
                                }
                            });
                        });
                    };
                    return [2 /*return*/];
            }
        });
    });
}
exports.EditpolicyController = EditpolicyController;
