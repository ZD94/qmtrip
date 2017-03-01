/**
 * Created by chen on 2017/2/23.
 */
import {Staff, EStaffRole} from 'api/_types/staff/staff';
import {ECompanyType} from "api/_types/company/company";

export async function ServicePayController($scope){
    require('./service-pay.scss');
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.company = staff.company;
    $scope.EStaffRole = EStaffRole;
    $scope.ECompanyType = ECompanyType;
    $scope.isExpiry = staff.company.expiryDate && staff.company.expiryDate < new Date();
}