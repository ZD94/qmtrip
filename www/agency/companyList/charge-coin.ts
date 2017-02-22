import async = Q.async;
var msgbox = require('msgbox');
/**
 * Created by chen on 2017/2/14.
 */
export function ChargeCoinController($scope,$stateParams,Models){
    let companyId= $stateParams.companyId;
    $scope.init = async function(){
        let company = await Models.company.get(companyId);
        $scope.company = company;
        $scope.chargeCoin = async function() {
            let coin = await company.coinAccount;
            let reg = /^[-]?[1-9](\d)*$/;
            if (!$scope.coins || !reg.test($scope.coins)) {
                msgbox.alert("请输入合法的鲸币数");
                $scope.coins = '';
                return;
            }
           let result = await coin.addCoin($scope.coins);
            msgbox.alert("充值成功");
            $scope.coins = '';
        }
        $scope.reset=async function(){
            $scope.coins = '';
        }
    }
    $scope.init();
}
