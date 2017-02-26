import {AgencyUser} from "api/_types/agency/agency-user";
/**
 * Created by chen on 2017/2/16.
 */
const msgbox=require("msgbox");
import moment=require("moment");
export async function AddFlowPackageController($scope,$stateParams,Models){
    $scope.qs={
        AddTwenty:'',
        AddFifty:'',
        remark:''
    };
    let agencyUser = await AgencyUser.getCurrent();
    let companyId = $stateParams.companyId;
    $scope.init=async function(){
        let company=await Models.company.get(companyId);
        $scope.company=company;
        $scope.chargeFlowPackage=async function(){
            if(!$scope.qs.AddTwenty && !$scope.qs.AddFifty){
                msgbox.alert("请选择合法的流量包");
                return ;
            }else if($scope.qs.AddTwenty && $scope.qs.AddFifty){
                msgbox.alert("不能同时选择两个流量包");
                return ;
            }
            if(!$scope.qs.remark){
                $scope.qs.remark = '';
            }
            let res = await agencyUser.addFlowPackage(companyId, $scope.qs);
            msgbox.alert("充值成功");
        }
    }

    $scope.init();

}