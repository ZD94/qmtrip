/**
 * Created by seven on 16/5/9.
 */
"use strict";
import {EStaffRole} from "api/_types/staff";

var Cookie = require('tiny-cookie');

export async function ManagementController($scope,Models){
    
}

export async function BudgetController($scope){

}

export async function RecordController($scope){

}

export async function DistributionController($scope){

}

export async function DepartmentController($scope){

}

export async function EditpolicyController($scope, Models, $stateParams, $location, $ionicHistory){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    if($stateParams.policyId){
        console.info($stateParams);
        $scope.travelPolicy = await Models.travelPolicy.get($stateParams.policyId);
    }else{
        $scope.travelPolicy= await {
            companyId:company.id,
            planeLevel:'不限',
            planeDiscount:'不限',
            trainLevel:'不限',
            hotelLevel:'五星级/豪华型'
        };
        console.info($scope.travelPolicy);
    }
    $scope.savePolicy = async function(){
        if($stateParams.policyId){
            console.info($scope.travelPolicy);
            await $scope.travelPolicy.save();
        }else{
            $scope.travelPolicy = await Models.travelPolicy.create($scope.travelPolicy);
            
        }
        $ionicHistory.nextViewOptions({
            historyRoot: true,
            disableAnimate: true,
            expire: 300
        });
        $ionicHistory.goBack(-1);
    }
}

export async function StaffsController($scope, Models){
    console.info("ddd...");
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
    await Promise.all($scope.staffs.map(async function(obj){
        obj.travelPolicy = await obj.staff.getTravelPolicy();
        console.info("there",obj);
        return obj;
    }));
    $scope.search = function(){
        
    }
}

export async function StaffdetailController($scope, $stateParams, Models, $ionicHistory){
    let staff;
    if($stateParams.staffId){
        staff = await Models.staff.get($stateParams.staffId);
    }else{
        staff = {}
    }
    $scope.staff = staff;
    var role = 'false';
    if(staff.roleId == EStaffRole.OWNER || staff.roleId == EStaffRole.ADMIN){
        role = 'true';
    }
    $scope.role = role;
    var currentstaff = await Models.staff.get(Cookie.get('user_id'));
    var company = await currentstaff.company;
    $scope.travelpolicylist = await company.getTravelPolicies();
    console.info($scope.travelpolicylist);
    // $scope.departmentlist = await company.department.get(companyId);
    $scope.savestaff = function(){
        if($scope.role =='true'){
            $scope.staff.roleId == EStaffRole.ADMIN;
        }else{
            $scope.staff.roleId == EStaffRole.COMMON;
        }
        if($stateParams.staffId){
            $scope.staff.save();
        }else{
            $scope.staff.companyId = currentstaff.companyId;
            Models.staff.create($scope.staff);
        }

        $ionicHistory.nextViewOptions({
            historyRoot: true,
            disableAnimate: true,
            expire: 300
        })
        $ionicHistory.goBack(-1);
    }
}

export async function TravelpolicyController($scope , Models, $location){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    $scope.travelPolicys = await company.getTravelPolicies();
    console.info($scope.travelPolicys);
    $scope.editpolicy = async function(id){
        var travelpolicy = await Models.travelPolicy.get(id);
        $location.path('/company/editpolicy').search({'policyId':id}).replace();
        console.info(travelpolicy);
        // window.location.href = '#/company/editpolicy?policyId='+id;
    }
}
