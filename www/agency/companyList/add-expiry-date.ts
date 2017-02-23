
/**
 * Created by chen on 2017/2/15.
 */
let msgbox=require("msgbox");
import moment=require("moment");
import async = Q.async;
import {ECompanyType} from "api/_types/company/company";
import {AgencyUser} from "api/_types/agency/agency-user";

export async function AddExpiryDateController($scope,$stateParams,Models){
    $scope.qs = {
        months:'',
        remark:'',
        IsChange:''
    };
    let companyId = $stateParams.companyId;
    let agencyUser = await AgencyUser.getCurrent();
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
            if (!$scope.qs.months || !reg.test($scope.qs.months)) {
                msgbox.alert('请输入合法月份!');
                return;
            }
            let res = await agencyUser.addExpiryDate(companyId , $scope.qs);
            //如果新的到期时间早于当前时间
            /*
            if(moment(newExpiryDate).diff(new Date(), 'seconds')<0){
                msgbox.alert("到期时间早于当前时间");
                $scope.query.months = '';
                return;
            }
            */
            // company.expiryDate = newExpiryDate;
            msgbox.alert("充值成功");
            //需要刷新页面
            $scope.qs.IsChangType = '';
            $scope.qs.months = '';
            $scope.qs.remark='';
        }
    }
    $scope.init();
}