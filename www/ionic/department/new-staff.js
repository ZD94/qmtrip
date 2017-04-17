/**
 * Created by seven on 2017/1/21.
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
var staff_1 = require("_types/staff/staff");
var index_1 = require("_types/index");
var language_1 = require("@jingli/language");
var validator = require("validator");
var pager_1 = require("common/model/pager");
var set_department_1 = require("./set-department");
var _ = require('lodash');
var msgbox = require('msgbox');
var utils = require("www/util");
var CheckUsername = utils.CheckUsername;
function NewStaffController($scope, Models, $ionicActionSheet, ngModalDlg, $stateParams, $ionicPopup, $ionicHistory) {
    return __awaiter(this, void 0, void 0, function () {
        function staffSave(callback) {
            return __awaiter(this, void 0, void 0, function () {
                var staff, ownerModifyAdmin, account2, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            staff = $scope.staff;
                            ownerModifyAdmin = false;
                            if (!staff.name) {
                                msgbox.log('姓名不能为空');
                                return [2 /*return*/];
                            }
                            if (!CheckUsername(staff.name)) {
                                msgbox.log('姓名格式不符合要求，请重新输入');
                                return [2 /*return*/];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 9, , 10]);
                            if (!staff.mobile) {
                                throw language_1.default.ERR.MOBILE_EMPTY();
                            }
                            if (staff.mobile && !validator.isMobilePhone(staff.mobile, 'zh-CN')) {
                                throw language_1.default.ERR.MOBILE_NOT_CORRECT();
                            }
                            if (!!$stateParams.staffId) return [3 /*break*/, 2];
                            //管理员添加员工只能添加普通员工
                            if (current.roleId == staff_1.EStaffRole.ADMIN) {
                                staff.roleId = staff_1.EStaffRole.COMMON;
                            }
                            return [3 /*break*/, 5];
                        case 2:
                            if (!staff.mobile) return [3 /*break*/, 4];
                            return [4 /*yield*/, Models.account.find({ where: { mobile: staff.mobile, type: 1, id: { $ne: staff.id } } })];
                        case 3:
                            account2 = _a.sent();
                            if (account2 && account2.length > 0) {
                                throw language_1.default.ERR.MOBILE_HAS_REGISTRY();
                            }
                            _a.label = 4;
                        case 4:
                            if (!$scope.addedArray.length) {
                                msgbox.log('部门不能为空');
                                return [2 /*return*/, false];
                            }
                            // 创建人修改管理员权限(二次确认)
                            if (current.roleId == staff_1.EStaffRole.OWNER && preRole == staff_1.EStaffRole.ADMIN && staff.roleId == staff_1.EStaffRole.COMMON) {
                                ownerModifyAdmin = true;
                                $ionicPopup.show({
                                    title: '确认要取消TA的管理员身份吗？',
                                    scope: $scope,
                                    buttons: [
                                        {
                                            text: '取消',
                                            onTap: function (e) {
                                                return __awaiter(this, void 0, void 0, function () {
                                                    return __generator(this, function (_a) {
                                                        $scope.role = { id: true };
                                                        return [2 /*return*/];
                                                    });
                                                });
                                            }
                                        },
                                        {
                                            text: '确定',
                                            type: 'button-positive',
                                            onTap: function (e) {
                                                return __awaiter(this, void 0, void 0, function () {
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0: return [4 /*yield*/, staff.save()];
                                                            case 1:
                                                                staff = _a.sent();
                                                                return [4 /*yield*/, staff.saveStaffDepartments($scope.addedArray)];
                                                            case 2:
                                                                _a.sent();
                                                                callback();
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                    ]
                                });
                            }
                            _a.label = 5;
                        case 5:
                            if (!!ownerModifyAdmin) return [3 /*break*/, 8];
                            return [4 /*yield*/, staff.save()];
                        case 6:
                            staff = _a.sent();
                            return [4 /*yield*/, staff.saveStaffDepartments($scope.addedArray)];
                        case 7:
                            _a.sent();
                            callback();
                            _a.label = 8;
                        case 8: return [3 /*break*/, 10];
                        case 9:
                            err_1 = _a.sent();
                            if (err_1.code == -1) {
                                $scope.staff.roleId = staff_1.EStaffRole.ADMIN;
                            }
                            msgbox.log(err_1.msg || err_1);
                            return [3 /*break*/, 10];
                        case 10: return [2 /*return*/];
                    }
                });
            });
        }
        function BackToDetail() {
            window.location.href = "#/department/staff-info?staffId=" + $scope.staff.id;
        }
        function AddAnotherOne() {
            staff = staff_1.Staff.create();
            staff.company = company;
            staff.sex = 0;
            if (travelpolicylist && travelpolicylist.length > 0) {
                staff.travelPolicyId = travelpolicylist[0].id;
            }
            $scope.staff = staff;
            $scope.staffPolicyName = '';
            $scope.selectDepartments = [];
        }
        var staff, preRole, staffId, current, currentRole, company, travelpolicylist, department, defaultTravelPolicy, currentPolicy, departments, roles, travelPolicies;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    require('./new-staff.scss');
                    staffId = $scope.staffId = $stateParams.staffId;
                    return [4 /*yield*/, staff_1.Staff.getCurrent()];
                case 1:
                    current = _a.sent();
                    currentRole = current.roleId;
                    company = current.company;
                    return [4 /*yield*/, company.getTravelPolicies()];
                case 2:
                    travelpolicylist = _a.sent();
                    return [4 /*yield*/, company.getDefaultDepartment()];
                case 3:
                    department = _a.sent();
                    return [4 /*yield*/, company.getDefaultTravelPolicy()];
                case 4:
                    defaultTravelPolicy = _a.sent();
                    $scope.selectDepartments = []; //用于存放已选择的部门
                    $scope.addedArray = []; //用于存放提交时的部门id
                    $scope.staffPolicyName = defaultTravelPolicy.name;
                    if (!staffId) return [3 /*break*/, 8];
                    return [4 /*yield*/, Models.staff.get(staffId)];
                case 5:
                    staff = _a.sent();
                    Models.resetOnPageChange(staff);
                    preRole = staff.roleId;
                    return [4 /*yield*/, staff.getTravelPolicy()];
                case 6:
                    currentPolicy = _a.sent();
                    if (!currentPolicy) {
                        $scope.staffPolicyName = '';
                    }
                    else {
                        $scope.staffPolicyName = currentPolicy.name;
                    }
                    return [4 /*yield*/, staff.getDepartments()];
                case 7:
                    departments = _a.sent();
                    //prototype Pager departmentpager
                    Object.setPrototypeOf(departments, pager_1.Pager.prototype);
                    $scope.selectDepartments = departments;
                    departments.map(function (department) {
                        $scope.addedArray.push(department.id);
                        $scope.addedArray.sort();
                    });
                    return [3 /*break*/, 9];
                case 8:
                    staff = staff_1.Staff.create();
                    staff.company = company;
                    staff.sex = 0;
                    if (travelpolicylist && travelpolicylist.length > 0) {
                        staff.travelPolicyId = travelpolicylist[0].id;
                    }
                    staff.isNeedChangePwd = true;
                    _a.label = 9;
                case 9:
                    $scope.staff = staff;
                    $scope.EStaffRoleNames = staff_1.EStaffRoleNames;
                    $scope.invoicefuc = { title: '上传头像', done: function (response) {
                            if (response.ret != 0) {
                                console.error(response.errMsg);
                                $ionicPopup.alert({
                                    title: '错误',
                                    template: response.errMsg
                                });
                                return;
                            }
                            var fileId = response.fileId;
                            staff.avatar = fileId[0];
                        } };
                    $scope.sexes = [
                        { name: '男', value: index_1.EGender.MALE },
                        { name: '女', value: index_1.EGender.FEMALE }
                    ];
                    roles = staff_1.EStaffRoleNames.map(function (rolename) {
                        return { text: rolename, role: staff_1.EStaffRoleNames.indexOf(rolename) };
                    });
                    //begin 以下对于role分级暂时没用
                    roles = roles.filter(function (v) {
                        if (current.roleId == staff_1.EStaffRole.OWNER) {
                            if (v.role != staff_1.EStaffRole.OWNER) {
                                return v;
                            }
                        }
                        else {
                            if (v.role != staff_1.EStaffRole.OWNER && v.role != staff_1.EStaffRole.ADMIN) {
                                if (v.role != staff_1.EStaffRole.OWNER) {
                                    return v;
                                }
                            }
                        }
                    });
                    //end
                    $scope.chooseRole = function () {
                        if (currentRole != staff_1.EStaffRole.OWNER) {
                            msgbox.log('你不是创建者，无法修改角色');
                            return false;
                        }
                        else if (currentRole == staff_1.EStaffRole.OWNER && staff.id == current.id) {
                            msgbox.log('创建者无法修改自身角色');
                            return false;
                        }
                        var hideSheet = $ionicActionSheet.show({
                            buttons: roles,
                            titleText: '请选择角色',
                            cancelText: '取消',
                            destructiveText: '转让创建人',
                            destructiveButtonClicked: function () {
                                $ionicPopup.show({
                                    title: '转让创建人',
                                    template: "\u521B\u5EFA\u4EBA\u8EAB\u4EFD\u8F6C\u8BA9\u540E\uFF0C\u60A8\u5C06\u53D8\u4E3A\u666E\u901A\u7BA1\u7406\u5458\uFF0C\u6240\u6709\u521B\u5EFA\u4EBA\u7684\u6743\u9650\u5C06\u8F6C\u79FB\u7ED9" + staff.name + "\uFF0C\u786E\u8BA4\u8F6C\u8BA9\u4E48\uFF1F",
                                    scope: $scope,
                                    buttons: [
                                        {
                                            text: '取消',
                                            type: 'button-outline button-positive'
                                        },
                                        {
                                            text: '确认',
                                            type: 'button-positive',
                                            onTap: function () {
                                                window.location.href = "#/department/change-owner?staffId=" + staff.id;
                                            }
                                        }
                                    ]
                                });
                            },
                            cancel: function () {
                                // add cancel code..
                                return true;
                            },
                            buttonClicked: function (index) {
                                $scope.staff.roleId = roles[index].role;
                                return true;
                            }
                        });
                    };
                    travelPolicies = travelpolicylist.map(function (travelPolicy) {
                        return { text: travelPolicy.name, travelPolicy: travelPolicy };
                    });
                    $scope.choosePolicy = function () {
                        var hideSheet = $ionicActionSheet.show({
                            buttons: travelPolicies,
                            titleText: '请选择差旅标准',
                            cancel: function () {
                            },
                            buttonClicked: function (index) {
                                $scope.staff.travelPolicyId = travelPolicies[index].travelPolicy.id; //??????不能用了？？
                                $scope.staffPolicyName = travelPolicies[index].travelPolicy.name;
                                return true;
                            }
                        });
                    };
                    $scope.setDepartment = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var rootDepartment, childDepartments, dptBeenChecked;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, company.getRootDepartment()];
                                    case 1:
                                        rootDepartment = _a.sent();
                                        return [4 /*yield*/, rootDepartment.getChildDeptStaffNum()];
                                    case 2:
                                        childDepartments = _a.sent();
                                        return [4 /*yield*/, ngModalDlg.createDialog({
                                                parent: $scope,
                                                scope: {
                                                    rootDepartment: rootDepartment,
                                                    childDepartments: childDepartments,
                                                    addedDepartments: $scope.selectDepartments
                                                },
                                                template: require('./staff-set-department.html'),
                                                controller: set_department_1.setDepartment
                                            })];
                                    case 3:
                                        dptBeenChecked = _a.sent();
                                        $scope.selectDepartments = dptBeenChecked;
                                        if (dptBeenChecked) {
                                            $scope.addedArray = [];
                                            dptBeenChecked.map(function (deparment) {
                                                $scope.addedArray.push(deparment.id);
                                                $scope.addedArray.sort();
                                            });
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        });
                    };
                    $scope.saveStaff = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        $ionicHistory.nextViewOptions({
                                            /*disableBack: true,*/
                                            disableBack: false,
                                            expire: 300
                                        });
                                        if (!$scope.staffId) return [3 /*break*/, 2];
                                        return [4 /*yield*/, $scope.staff.deleteStaffDepartments()];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2:
                                        staffSave(BackToDetail);
                                        return [2 /*return*/];
                                }
                            });
                        });
                    };
                    $scope.addAnother = function () {
                        $ionicHistory.nextViewOptions({
                            /*disableBack: true,*/
                            disableBack: false,
                            expire: 300
                        });
                        staffSave(AddAnotherOne);
                    };
                    return [2 /*return*/];
            }
        });
    });
}
exports.NewStaffController = NewStaffController;
