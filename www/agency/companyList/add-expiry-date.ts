import {ECompanyType} from "api/_types/company/company";
/**
 * Created by chen on 2017/2/15.
 */
let msgbox=require("msgbox");
import moment=require("moment");
import async = Q.async;

export function AddExpiryDateController($scope,$stateParams,Models){
    let companyId = $stateParams.companyId;
    $scope.init=async function(){
        let company = await Models.company.get(companyId);
        $scope.company = company;
        //付费企业的企业类型改变不显示
        if(company.type == ECompanyType.PAYED){
            $scope.IsPayed= true;
        }else{
            $scope.IsPayed = false;
        }
        $scope.chargeMonths = async function(){
            const reg=/^-?[1-9](\d)*$/;
            if (!$scope.months || !reg.test($scope.months)) {
                msgbox.alert('请输入合法月份!');
                return;
            }
            let newExpiryDate = new Date(moment(company.expiryDate).add($scope.months,'months').valueOf());
            //如果新的到期时间早于当前时间
            if(moment(newExpiryDate).diff(new Date(), 'seconds')<0){
                msgbox.alert("到期时间早于当前时间");
                $scope.months = '';
                return;
            }
            company.expiryDate = newExpiryDate;
            //改变企业类型由试用改为付费
            if($scope.IsChange){
                company.type = ECompanyType.PAYED;
            }
            await company.save();
            msgbox.alert("充值成功");
            $scope.IsChangType = '';
            $scope.months = '';
        }
    }
    $scope.init();
}