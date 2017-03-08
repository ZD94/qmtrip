/**
 * Created by seven on 2016/11/24.
 */
"use strict";
import {Staff} from "api/_types/staff/staff";
import {ECompanyType} from "api/_types/company/company";

export default async function IndexController($scope,CNZZ){
    require('./manage.scss');
    let staff = await Staff.getCurrent();
    $scope.staff = staff;
    CNZZ.addEvent("管理企业","点击","进入管理企业",$scope.staff);
    $scope.ECompanyType = ECompanyType;
}