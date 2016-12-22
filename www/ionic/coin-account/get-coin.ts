import { ENoticeType } from 'api/_types/notice/notice';
import { Staff } from 'api/_types/staff/staff';
var msgbox = require('msgbox');

export async function GetCoinController($scope, Models, $stateParams) {
    require('./get-coin.scss');
    $scope.ENoticeType = ENoticeType;
    let staff = await Staff.getCurrent();
    let companyCoinAccount = await Models.coinAccount.get(staff.company["coinAccountId"]);
    $scope.staff = staff;
    $scope.companyCoinAccount = companyCoinAccount;
    $scope.convertALL = function(){

    }
    $scope.exchange = async function(){
        try{
            await staff.score2Coin({points: $scope.staff.exchangeNum});
            window.location.href = '#/coin-account/index';
            msgbox.log("兑换成功");
        }catch (err){
            msgbox.log(err.msg);
        }
    };
}