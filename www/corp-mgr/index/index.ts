/**
 * Created by wlh on 2017/2/13.
 */

'use strict';
import {Staff} from "api/_types/staff/staff";

export async function IndexController($scope, Models) {
    $scope.name = '王希望';
    let current = await Staff.getCurrent();
    // let city = await Models.staff.find({});

    console.log(current);
}