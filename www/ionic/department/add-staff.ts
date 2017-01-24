/**
 * Created by seven on 2017/1/21.
 */
"use strict";

export async function AddStaffController($scope){
    require('./add-staff.scss');
    $scope.addStaff = function(){
        window.location.href = '#/department/new-staff'
    }
}