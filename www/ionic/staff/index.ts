import { Staff, EStaffRole, EAddWay } from '_types/staff/staff';
import { ACCOUNT_STATUS } from '_types/auth';
import { EPlanStatus, QMEApproveStatus ,EAuditStatus } from '_types/tripPlan';
import {getImageUrl} from '../controller';
var config = require('@jingli/config');
declare var API;
export default async function IndexController($scope, Models, inAppBrowser) {
    require('./index.scss');
    API.require('tripPlan');

    let staff = await Staff.getCurrent();
    let coinAccount = staff.$parents["account"]["coinAccount"];

    $scope.toDuiBa = async function(){

        if(staff.email.indexOf('jingli.tech')>=0){
            var duiBaUrl = await staff.getDuiBaLoginUrl({});
            inAppBrowser.open(duiBaUrl);
        }
        // window.location.href = '#/duiba/index';

    }







    $scope.toCoinAccount = function(){
        if(staff.email.indexOf('jingli.tech')>=0){
            window.location.href= '#/coin-account/index';
        }
    }
    if(staff.roleId == EStaffRole.OWNER){
        let isFirstLogin = await staff.company.getTravelPolicies();
        if(isFirstLogin.length == 0){
            window.location.href = '#/guide/company-guide';
        }
    }
    var tripBudget = await API.tripPlan.statisticTripBudget({isStaff: true});
    $scope.tripBudget = tripBudget;
    $scope.staff = staff;
    $scope.coinAccount = coinAccount;
    $scope.EStaffRole = EStaffRole;
    $scope.EPlanStatus = EPlanStatus;
    $scope.QMEApproveStatus = QMEApproveStatus;
    await config.$ready;
    $scope.getImageUrl = getImageUrl;
}
