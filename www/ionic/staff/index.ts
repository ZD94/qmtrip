import { Staff, EStaffRole } from 'api/_types/staff/staff';
import { EPlanStatus, QMEApproveStatus ,EAuditStatus } from 'api/_types/tripPlan';
import {getImageUrl} from '../controller';
var config = require('config');
export default async function IndexController($scope, Models, inAppBrowser) {
    require('./index.scss');
    API.require('tripPlan');

    let staff = await Staff.getCurrent();
    $scope.toDuiBa = async function(){
        // window.location.href = '#/duiba/index';
        var duiBaUrl = await staff.getDuiBaLoginUrl({});
        inAppBrowser.open(duiBaUrl);
    }
    $scope.toCoinAccount = function(){
        window.location.href= '#/coin-account/index';
    }
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
