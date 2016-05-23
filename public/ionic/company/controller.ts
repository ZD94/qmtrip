/**
 * Created by seven on 16/5/9.
 */
"use strict";
import {EStaffRole, Staff} from "api/_types/staff";
import {TravelPolicy} from "api/_types/travelPolicy";
import {Department} from "api/_types/department";

export async function ManagementController($scope, Models) {
    var staff = await Staff.getCurrent();
    var company = staff.company;
    var [staffs, policies,departments] = await Promise.all([
        company.getStaffs(),
        company.getTravelPolicies(),
        company.getDepartments()
    ]);
    $scope.staffsnum = staffs.length;
    $scope.departmentsnum = departments.length;
    $scope.policiesnum = policies.length;
}

export async function BudgetController($scope) {

}

export async function RecordController($scope) {

}

export async function DistributionController($scope) {

}

export async function DepartmentController($scope, Models, $ionicPopup ,$route) {
    var staff = await Staff.getCurrent();
    var departments = await staff.company.getDepartments();
    $scope.departments = departments.map(function (department) {
        var depart = {department: department, staffnum: 0};
        return depart;
    });
    await Promise.all($scope.departments.map(async function (depart) {
        console.info(depart);
        var result = await depart.department.getStaffs();
        depart.staffnum = result.length;
        return depart;
    }));
    var newdepartment = $scope.newdepartment = Department.create();
    $scope.newdepart = function () {
        var nshow = $ionicPopup.show({
            template: '<input type="text" ng-model="newdepartment.name">',
            title: '创建部门',
            scope: $scope,
            buttons: [
                {
                    text: '取消'
                },
                {
                    text: '保存',
                    type: 'button-positive',
                    onTap: function (e) {
                        if (!$scope.newdepartment.name) {
                            e.preventDefault();
                        } else {
                            $scope.newdepartment.save();
                            $route.reload();
                        }
                    }
                }
            ]
        })
    }
}

export async function StaffsController($scope, Models) {
    var staff = await Staff.getCurrent();
    var staffs = await staff.company.getStaffs();
    $scope.staffs = staffs.map(function (staff) {
        var obj = {staff: staff, role: ""};
        if (obj.staff.roleId == EStaffRole.OWNER) {
            obj.role = '创建者';
        }
        return obj;
    });
    console.info(staffs);
    await Promise.all($scope.staffs.map(async function (obj) {
        obj.travelPolicy = await obj.staff.getTravelPolicy();
        return obj;
    }));
    $scope.search = function () {

    }
}

export async function StaffdetailController($scope, $stateParams, Models, $ionicHistory) {
    //使下一个面变为根目录可呼出menu
    $ionicHistory.nextViewOptions({
        historyRoot: true,
        disableAnimate: true,
        expire: 300
    });

    let staff;
    var currentstaff = await Staff.getCurrent();
    var company = currentstaff.company;
    if ($stateParams.staffId) {
        staff = await Models.staff.get($stateParams.staffId);
    } else {
        staff = Staff.create();
        staff.company = company;
    }
    $scope.staff = staff;
    var role = {id: false};
    if (staff.roleId == EStaffRole.OWNER || staff.roleId == EStaffRole.ADMIN) {
        role.id = true;
    }
    $scope.role = role;
    console.info(role);
    console.info(staff.roleId);

    $scope.travelpolicylist = await company.getTravelPolicies();
    $scope.departmentlist = await company.getDepartments();
    console.info($scope.departmentlist);
    $scope.savestaff = function () {
        let _staff = $scope.staff;
        if (_staff.travelPolicyId && _staff.travelPolicyId.id) {
            _staff.travelPolicyId = _staff.travelPolicyId.id;
        }
        console.info(role, $scope.role);
        if ($scope.role && $scope.role.id == true) {
            _staff.roleId = EStaffRole.ADMIN;
        } else {
            _staff.roleId = EStaffRole.COMMON;
        }
        _staff.save();
        $ionicHistory.goBack(-1);
    }
    $scope.showrole = function () {
        if ($scope.role.id == true) {
            $scope.staff.roleId = EStaffRole.ADMIN;
        } else {
            $scope.staff.roleId = EStaffRole.COMMON;
        }
        // console.info($scope.role);
        // console.info($scope.staff);
        // console.info($scope.staff.travelPolicyId);
        $ionicHistory.goBack(-1);
    }
}

export async function TravelpolicyController($scope, Models, $location) {
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var travelPolicies = await company.getTravelPolicies();
    $scope.travelPolicies = travelPolicies.map(function (policy) {
        var obj = {policy: policy, usernum: ''};
        return obj;
    })
    await Promise.all($scope.travelPolicies.map(async function (obj) {
        var result = await obj.policy.getStaffs();
        obj.usernum = result.length;
        return obj;
    }))
    console.info($scope.travelPolicies);
    $scope.editpolicy = async function (id) {
        var travelpolicy = await Models.travelPolicy.get(id);
        $location.path('/company/editpolicy').search({'policyId': id}).replace();
        console.info(travelpolicy);
    }
}

export async function EditpolicyController($scope, Models, $stateParams, $ionicHistory) {
    //使下一个面变为根目录可呼出menu
    $ionicHistory.nextViewOptions({
        historyRoot: true,
        disableAnimate: true,
        expire: 300
    });
    var discounts = $scope.discounts = [
        {value: 0, text: '不限'},
        {value: 9, text: '9折及以下'},
        {value: 8, text: '8折及以下'},
        {value: 7, text: '7折及以下'},
        {value: 6, text: '6折及以下'}
    ]
    var staff = await Staff.getCurrent();
    var travelPolicy;
    if ($stateParams.policyId) {
        console.info($stateParams);
        travelPolicy = await Models.travelPolicy.get($stateParams.policyId)
    } else {
        travelPolicy = TravelPolicy.create();
        travelPolicy.companyId = staff.company.id;
        travelPolicy.planeLevel = '不限';
        travelPolicy.planeDiscount = 0;
        travelPolicy.trainLevel = '不限';
        travelPolicy.hotelLevel = '五星级/豪华型';
    }
    console.info(travelPolicy);
    $scope.travelPolicy = travelPolicy;
    $scope.savePolicy = async function () {
        console.info($scope.travelPolicy);
        await $scope.travelPolicy.save();
        $ionicHistory.goBack(-1);
    }
    $scope.consoles = function (obj) {
        console.info("aaaaaaa");
        console.info(obj);
    }
}
