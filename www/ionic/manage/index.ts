/**
 * Created by seven on 2016/11/24.
 */
"use strict";
import {Staff} from "api/_types/staff/staff";

export default async function IndexController($scope){
    require('./manage.scss');
    let staff = await Staff.getCurrent();
    $scope.staff = staff;
}