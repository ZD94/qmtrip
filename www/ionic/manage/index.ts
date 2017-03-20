/**
 * Created by seven on 2016/11/24.
 */
"use strict";
import {Staff} from "_types/staff/staff";
import {ECompanyType} from "_types/company/company";

export default async function IndexController($scope){
    require('./manage.scss');
    let staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.ECompanyType = ECompanyType;
}