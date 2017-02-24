/**
 * Created by chen on 2017/2/24.
 */
import { Staff } from 'api/_types/staff/staff';
import {NUM_CHANGE_TYPE} from "api/_types/company/trip-plan-num-change";

export async function TripNumController($scope){
    require("./trip-num.scss");
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.company = staff.company;
    let extraRemain = $scope.company.tripPlanNumLimit-$scope.company.tripPlanPassNum-$scope.company.tripPlanFrozenNum;
    if( extraRemain < 0){
        extraRemain = 0
    }
    $scope.company["extraRemain"] = extraRemain;

    let pager = await $scope.company.getTripPlanNumChanges();
    let item = pager.map( async (trip)=>{
        let staff = await trip.account.name;
        trip["staff"] = staff;
        return trip;
    })
    let tripPlanNumInfo = await Promise.all(pager);
    $scope.tripPlanNumInfo = tripPlanNumInfo;
    $scope.NUM_CHANGE_TYPE = NUM_CHANGE_TYPE;
}