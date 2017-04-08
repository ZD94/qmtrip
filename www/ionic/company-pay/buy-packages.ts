/**
 * Created by chen on 2017/2/23.
 */
import { Staff } from '_types/staff/staff';
import {ECompanyType} from "_types/company/company";
export async function BuyPackagesController($scope){
    require("./buy-packages.scss");
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.company = staff.company;
    $scope.ECompanyType = ECompanyType;
}