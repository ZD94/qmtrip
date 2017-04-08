import { ENoticeType } from '_types/notice/notice';
import { Staff } from '_types/staff/staff';
var msgbox = require('msgbox');
var validator = require('validator');
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
        if(validator.isInt($scope.staff.exchangeNum)){
            try{
                let exchangePoints = $scope.staff.exchangeNum/(staff.company.points2coinRate || 50);
                await staff.score2Coin({points: exchangePoints});
                window.location.href = '#/coin-account/index';
                msgbox.log("兑换成功");
            }catch (err){
                msgbox.log(err.msg);
            }
        }else {
            msgbox.log('兑换数量只能为整数');
            return;
        }
    }
}
