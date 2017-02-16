/**
 * Created by chen on 2017/2/16.
 */
const msgbox=require("msgbox");
import moment=require("moment");
export async function AddFlowPackageController($scope,$stateParams,Models){
    let companyId = $stateParams.companyId;
    $scope.init=async function(){
        let company=await Models.company.get(companyId);
        $scope.company=company;
        $scope.addFlowPackage=async function(){
            if(!$scope.AddTwenty && !$scope.AddFifty){
                msgbox.alert("请选择合法的流量包");
                return ;
            }else if($scope.AddTwenty && $scope.AddFifty){
                msgbox.alert("不能同时选择两个流量包");
                return ;
            }
            if($scope.AddTwenty){
                company.extraTripPlanNum=company.extraTripPlanNum+20;
            }
            if($scope.AddFifty){
                company.extraTripPlanNum=company.extraTripPlanNum+50;
            }
            let newExpiryDate = new Date(moment(company.expiryDate).add(3,'months').valueOf());
            company.expiryDate = newExpiryDate;
            company.save();
            msgbox.alert("充值成功");
        }
    }

    $scope.init();

}