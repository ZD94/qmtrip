import { Staff, EStaffRole, EAddWay } from 'api/_types/staff/staff';
import { ACCOUNT_STATUS } from 'api/_types/auth';
import { EPlanStatus, QMEApproveStatus ,EAuditStatus } from 'api/_types/tripPlan';
import {getImageUrl} from '../controller';
var config = require('config');
export default async function IndexController($scope, Models, inAppBrowser,CNZZ) {
    require('./index.scss');
    API.require('tripPlan');

    let staff = await Staff.getCurrent();
    let coinAccount = staff.$parents["account"]["coinAccount"];
    CNZZ.addEvent("个人中心","点击","进入个人中心", staff);

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
