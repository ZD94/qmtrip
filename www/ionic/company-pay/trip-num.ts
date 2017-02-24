/**
 * Created by chen on 2017/2/24.
 */
import { Staff } from 'api/_types/staff/staff';
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
}