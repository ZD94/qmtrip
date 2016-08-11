/**
 * Created by seven on 16/8/8.
 */
'use strict';
import {Staff, EStaffRole} from 'api/_types/staff';

export async function IndexController($scope,Models) {
    require('./index.scss');
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.EStaffRole = EStaffRole;
}

export async function StaffInfoController($scope,Models) {
    require('./staffInfo.scss');
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.company = await staff.company;
    $scope.department = await staff.department;
    $scope.travelpolicy = await staff.getTravelPolicy(staff['travelPolicyId']);
    $scope.staffRole = ['创建者','员工','管理员','财务'];
}

export async function EditMobileController($scope,Models) {
    require('./editMobile.scss');
}

export async function EditEmailController($scope,Models) {
    require('./editMobile.scss');
}

export async function EditPwdController($scope,Models) {
    require('./editMobile.scss');
    $scope.form = {
        oldPwd:'',
        newPwd:'',
        confirmPwd:''
    }
}