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

export async function EditpolicyController($scope, Models, $stateParams, $location){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    if($stateParams.policyId){
        $scope.travelPolicy = await Models.travelPolicy.get($stateParams.policyId);
    }else{
        $scope.travelPolicy={
            companyId:company.id,
            plane:'不限',
            planediscount:'不限',
            train:'不限',
            hotel:'不限'
        };
    }
    $scope.savePolicy = async function(){
        if($stateParams.policyId){
            await $scope.travelPolicy.save();
        }else{
            $scope.travelPolicy = await Models.travelPolicy.create($scope.travelPolicy);
            
        }
        $location.hash = "/company/travelpolicy";
    }
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
    await Promise.all($scope.staffs.map(async function(obj){
        obj.travelPolicy = await obj.staff.getTravelPolicy();
    }));
    $scope.search = function(){
        
    }
    // var company = await Models.company.get(staff.companyId);
    // console.info(company);
    console.info(staff);
}

export async function StaffdetailController($scope, $stateParams, Models, $location){
    var staff = await Models.staff.get($stateParams.staffId);
    $scope.staff = staff;
    var role = 'false';
    if(staff.roleId == EStaffRole.OWNER || staff.roleId == EStaffRole.ADMIN){
        role = 'true';
    }
    $scope.role = role;
    var companyId = await staff.company.id;
    $scope.travelpolicylist = await Models.travelPolicy.get(companyId);
    $scope.departmentlist = await Models.department.get(companyId);
    $scope.savestaff = function(){
        $scope.staff.save();
        $location.hash = '/company/staffs';
    }
}

export async function TravelpolicyController($scope , Models){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    $scope.travelPolicys = await company.getTravelPolicy();
    $scope.editpolicy = async function(id){
        var travelpolicy = await Models.travelPolicy.get(id);
    }
}
