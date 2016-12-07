import { Staff, EStaffRole } from 'api/_types/staff/staff';
import { EPlanStatus, QMEApproveStatus ,EAuditStatus } from 'api/_types/tripPlan';
import {getImageUrl} from '../controller';
var config = require('config');
export default async function IndexController($scope, Models) {
    require('./index.scss');
    API.require('tripPlan');
    /*******************判断是否为第一次的登录  史聪************************/
    let staff = await Staff.getCurrent();
    if(staff.roleId == EStaffRole.OWNER){
        let isFirstLogin = await staff.company.getTravelPolicies();
        if(isFirstLogin.length == 0){
            window.location.href = '#/guide/company-guide';
        }
    }
    var tripBudget = await API.tripPlan.statisticTripBudget({isStaff: true});
    console.info(tripBudget);
    $scope.tripBudget = tripBudget;
    $scope.staff = staff;
    $scope.EStaffRole = EStaffRole;
    $scope.EPlanStatus = EPlanStatus;
    $scope.QMEApproveStatus = QMEApproveStatus;
    await config.$ready;
    $scope.getImageUrl = getImageUrl;
}
