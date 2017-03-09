/**
 * Created by chen on 2017/2/24.
 */
import { Staff } from '_types/staff/staff';
import {NUM_CHANGE_TYPE} from "_types/company/trip-plan-num-change";

export async function TripNumController($scope){
    require("./trip-num.scss");
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.company = staff.company;

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