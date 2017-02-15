/**
 * Created by chen on 2017/2/15.
 */
let msgbox=require("msgbox");
import moment=require("moment");

export function AddExpiryDateController($scope,$stateParams,Models){
    let companyNum = $stateParams.companyNum;
    $scope.init=async function(){
        let company = await Models.company.get(companyNum);
        $scope.company = company;
        $scope.chargeMonths=async function(){
            let result;
            try{
                if($scope.months){
                    //输入的数据不是数字类型时
                    let reg=/^[+-]?[1-9]([0-9]?)+$/;
                    if(reg.test($scope.months)){
                        let newExpiryDate= new Date(moment(company.expiryDate).add($scope.months,'months').valueOf());
                        // let newExpiryDate = new MyDate();
                        company.expiryDate=newExpiryDate;
                        await company.save();
                        msgbox.alert("充值成功");
                        $scope.months='';
                    }else{
                        msgbox.alert("请输入合法字符");
                    }
                }else{
                    msgbox.alert("请输入增加的月份");
                }
            }catch(err){
                msgbox.log(err.msg||err);
            }
        }
    }
    $scope.init();
}