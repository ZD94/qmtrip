import {StaffSupplierInfo} from "api/_types/staff/staff-supplier-info";
import { Staff } from 'api/_types/staff/staff';
var msgbox = require('msgbox');

export async function BindOthersController($scope, $stateParams, Models, $ionicHistory, $ionicPopup){
    $scope.form = {userName:'', pwd: ''};

    var staffSupplierInfo;
    var supplierId = $stateParams.supplierId;
    var staff = await Staff.getCurrent();
    var supplier = await Models.supplier.get(supplierId);
    var alreadyBind = await Models.staffSupplierInfo.find({where: {supplierId: supplierId, staffId: staff.id}});

    if(alreadyBind && alreadyBind.length>0){

        staffSupplierInfo = alreadyBind[0];
    }else{

        staffSupplierInfo = StaffSupplierInfo.create();
    }

    $scope.staffSupplierInfo = staffSupplierInfo;

    if(staffSupplierInfo.loginInfo){
        $scope.form = JSON.parse(staffSupplierInfo.loginInfo);
    }

    $scope.save = async function(){
        var checkoutResult = await staff.checkStaffSupplierInfo({supplierId: supplierId, userName: $scope.form.userName, pwd: $scope.form.pwd});
        if(checkoutResult){
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
    $scope.delete = async function(){
        $ionicPopup.show({
            title: '确定要解除绑定吗?',
            buttons: [
                {
                    text: '取消'
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function(){
                        await staffSupplierInfo.destroy();
                        msgbox.log('解绑成功');
                        $ionicHistory.goBack(-1);
                    }
                }
            ]
        })
    }
}