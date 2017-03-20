import {AgencyUser} from "_types/agency/agency-user";
var msgbox = require('msgbox');
/**
 * Created by chen on 2017/2/14.
 */
export async function ChargeCoinController($scope,$stateParams,Models){
    let companyId= $stateParams.companyId;
    let agencyUser = await AgencyUser.getCurrent();
    $scope.init = async function(){
        let company = await Models.company.get(companyId);
        $scope.company = company;
        $scope.chargeCoin = async function() {
            // let result = await agencyUser.addCompanyCoin(companyId, coin);
            // let coin = await company.coinAccount;
            let reg = /^[-]?[1-9](\d)*$/;
            if (!$scope.coins || !reg.test($scope.coins)) {
                msgbox.alert("请输入合法的鲸币数");
                $scope.coins = '';
                return;
            }
            if(!$scope.remark){
                $scope.remark = '';
            }
            let result = await agencyUser.addCompanyCoin(companyId, $scope.coins,$scope.remark);
            msgbox.alert("充值成功");
            $scope.coins = '';
            $scope.remark='';
        }
        $scope.reset=async function(){
            $scope.coins = '';
            $scope.remark='';
        }
    }
    $scope.init();

}
