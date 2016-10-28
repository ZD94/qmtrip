import {StaffSupplierInfo} from "api/_types/staff/staff-supplier-info";
import { Staff } from 'api/_types/staff/staff';
var msgbox = require('msgbox');

export async function BindOthersController($scope, $stateParams, Models, $ionicHistory){
    $scope.form = {userName:'', pwd: ''};
    var supplierId = $stateParams.supplierId;
    var staff = await Staff.getCurrent();
    var supplier = await Models.supplier.get(supplierId);
    $scope.save = async function(){
        var checkoutResult = await staff.checkStaffSupplierInfo({supplierId: supplierId, userName: $scope.form.userName, pwd: $scope.form.pwd});
       if(checkoutResult){
           var staffSupplierInfo = StaffSupplierInfo.create();
           staffSupplierInfo.loginInfo = JSON.stringify($scope.form);
           staffSupplierInfo.supplier = supplier;
           staffSupplierInfo.staff = staff;
           await staffSupplierInfo.save();
           msgbox.log("绑定成功");
           $ionicHistory.goBack(-1);
       }else{
           msgbox.log("验证失败");
       }
    }
}