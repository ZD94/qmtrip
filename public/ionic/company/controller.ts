/**
 * Created by seven on 16/5/9.
 */
"use strict";
import {EStaffRole} from "../../../api/_types/staff";

var Cookie = require('tiny-cookie');

export function ManagementController($scope){
    console.info("next ..");
}

export function BudgetController($scope){

}

export function RecordController($scope){

}

export function DistributionController($scope){

}

export function DepartmentController($scope){

}

export async function EditpolicyController($scope, Models, $stateParams, $location){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    $scope.travelPolicy = await Models.travelPolicy($stateParams.policyId);
    $scope.savePolicy = function(){
        if($stateParams.policyId){
            $scope.travelPolicy.save();
        }else{
            $scope.travelPolicy.create();
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
