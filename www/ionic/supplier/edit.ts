import { Staff } from 'api/_types/staff/staff';
import { Supplier } from 'api/_types/company/supplier';

var msgbox = require('msgbox');

export async function EditController($scope, Models, $stateParams, $ionicHistory, $ionicPopup) {
    require('./accord-hotel.scss');
    var staff = await Staff.getCurrent();
    var supplier;
    if ($stateParams.supplierId) {
        supplier = await Models.supplier.get($stateParams.supplierId);
    }else{
        supplier = Supplier.create();
        supplier.companyId = staff.company.id;
    }
    $scope.supplier = supplier;

    $scope.saveSupplier = async function () {
        if(!$scope.supplier.name){
            msgbox.log("供应商名称不能为空");
            return false;
        }
        $scope.supplier.company = staff.company;
        await $scope.supplier.save();
        $ionicHistory.goBack(-1);
    }

    $scope.deleteSupplier = async function (supplier) {
        $ionicPopup.show({
            title:'确定要删除该供应商吗?',
            scope: $scope,
            buttons:[
                {
                    text: '取消'
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function () {
                        try{
                            await supplier.destroy();
                            $ionicHistory.goBack(-1);
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        });
    }
}
