/**
 * Created by seven on 2017/1/22.
 */
"use strict";
import {EStaffRoleNames} from "api/_types/staff/staff";
import {Pager} from "common/model/pager";

export async function StaffInfoController($scope,Models,$stateParams){
    require('./new-staff.scss');
    let staff = await Models.staff.get($stateParams.staffId);
    let travelPolicy = await staff.getTravelPolicy();
    let departments = await staff.getDepartments();
    //prototype Pager departmentpager
    Object.setPrototypeOf(departments, Pager.prototype);
    $scope.staff = staff;
    $scope.travelPolicy = travelPolicy;
    $scope.departments = departments;
    console.info(departments);
    console.info(departments.length);
    $scope.EStaffRoleNames = EStaffRoleNames;
    $scope.editStaff = function(){
        window.location.href = `#/department/new-staff?staffId=${staff.id}`
    }
}