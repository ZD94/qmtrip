/**
 * Created by seven on 16/5/9.
 */
"use strict";
import {EStaffRole, Staff} from "api/_types/staff";
import {TravelPolicy} from "api/_types/travelPolicy";

var Cookie = require('tiny-cookie');

export async function ManagementController($scope,Models){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    $scope.staffsnum = await company.getStaffs().length;
    // $scope.departmentsnum = await company.getDepartments().length;
    $scope.policiesnum = await company.getTravelPolicies().length;
}

export async function BudgetController($scope){

}

export async function RecordController($scope){

}

export async function DistributionController($scope){

}

export async function DepartmentController($scope, Models, $ionicPopup){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    var departments = company.getDepartments();
    $scope.departments = departments;
}

export async function StaffsController($scope, Models){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = staff.company;
    var staffs = await company.getStaffs();
    $scope.staffs = staffs.map(function(staff){
        var obj = {staff:staff,role:""};
        if(obj.staff.roleId == EStaffRole.OWNER ){
            obj.role = '创建者';
        }
        return obj;
    });
    console.info(staffs);
    await Promise.all($scope.staffs.map(async function(obj){
        obj.travelPolicy = await obj.staff.getTravelPolicy();
        console.info("there",obj);
        return obj;
    }));
    $scope.search = function(){
        
    }
}

export async function StaffdetailController($scope, $stateParams, Models, $ionicHistory){
    //使下一个面变为根目录可呼出menu
    $ionicHistory.nextViewOptions({
        historyRoot: true,
        disableAnimate: true,
        expire: 300
    });

    let staff;
    var currentstaff = await Models.staff.get(Cookie.get('user_id'));
    var company = currentstaff.company;
    if($stateParams.staffId){
        staff = await Models.staff.get($stateParams.staffId);
    }else{
        staff = Staff.create();
        staff.company = company;
    }
    $scope.staff = staff;
    var role={id:false};
    if(staff.roleId == EStaffRole.OWNER || staff.roleId == EStaffRole.ADMIN){
        role.id = true;
    }
    $scope.role = role;

    $scope.travelpolicylist = await company.getTravelPolicies();
    // $scope.departmentlist = await company.department.get(companyId);
    $scope.savestaff = function(){
        let _staff = $scope.staff;
        if (_staff.travelLevel && _staff.travelLevel.id) {
            _staff.travelLevel = _staff.travelLevel.id;
        }

        if(_staff.role  && _staff.role.id ==true){
            _staff.roleId = EStaffRole.ADMIN;
        }else{
            _staff.roleId = EStaffRole.COMMON;
        }
        _staff.save();
        $ionicHistory.goBack(-1);
    }
    $scope.showrole = function(){
        if($scope.role.id ==true){
            $scope.staff.roleId = EStaffRole.ADMIN;
        }else{
            $scope.staff.roleId = EStaffRole.COMMON;
        }
        console.info($scope.role);
        console.info($scope.staff);
        $ionicHistory.goBack(-1);
    }
}

export async function TravelpolicyController($scope , Models, $location){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    var travelPolicies = await company.getTravelPolicies();
    $scope.travelPolicies = travelPolicies.map(function (policy) {
        var obj = {policy:policy,usernum:''};
        return obj;
    })
    await Promise.all($scope.travelPolicies.map(async function(obj){
        var result = await obj.policy.getStaffs();
        obj.usernum = result.length;
        return obj;
    }))
    console.info($scope.travelPolicies);
    $scope.editpolicy = async function(id){
        var travelpolicy = await Models.travelPolicy.get(id);
        $location.path('/company/editpolicy').search({'policyId':id}).replace();
        console.info(travelpolicy);
    }
}

export async function EditpolicyController($scope, Models, $stateParams, $ionicHistory){
    //使下一个面变为根目录可呼出menu
    $ionicHistory.nextViewOptions({
        historyRoot: true,
        disableAnimate: true,
        expire: 300
    });

    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = staff.company;
    var travelPolicy;
    if($stateParams.policyId){
        console.info($stateParams);
        travelPolicy = await Models.travelPolicy.get($stateParams.policyId);
    }else{
        travelPolicy = TravelPolicy.create();
        travelPolicy.companyId = company.id;
        travelPolicy.planeLevel = '不限';
        travelPolicy.planeDiscount = '不限';
        travelPolicy.trainLevel = '不限';
        travelPolicy.hotelLevel = '五星级/豪华型';
        console.info(travelPolicy);
    }
    $scope.travelPolicy = travelPolicy;
    $scope.savePolicy = async function(){
        console.info($scope.travelPolicy);
        $scope.travelPolicy.save();
        $ionicHistory.goBack(-1);
    }
}
