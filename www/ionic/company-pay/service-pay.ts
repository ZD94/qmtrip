/**
 * Created by chen on 2017/2/23.
 */
import {Staff, EStaffRole} from 'api/_types/staff/staff';

export async function ServicePayController($scope){
    require('./service-pay.scss');
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.company = staff.company;
    $scope.EStaffRole = EStaffRole;

}