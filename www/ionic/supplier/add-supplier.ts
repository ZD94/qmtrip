import { Staff } from 'api/_types/staff/staff';
import { Supplier } from 'api/_types/company/supplier';

var msgbox = require('msgbox');
var validator = require('validator');
//isURL

export async function AddSupplierController($scope, Models, $stateParams, $ionicHistory, $ionicPopup) {
    require('./accord-hotel.scss');
    $scope.uploadUrl = '/upload/ajax-upload-file?type=avatar';
    var staff = await Staff.getCurrent();
    var supplier;
    if ($stateParams.supplierId) {
        supplier = await Models.supplier.get($stateParams.supplierId);
    }else{
        supplier = Supplier.create();
        supplier.companyId = staff.company.id;
    }
    $scope.supplier = supplier;

    //供应商的自定义头像
    $scope.done = async function(ret){
        if(ret.ret != 0){
            console.error(ret.errMsg);
            $ionicPopup.alert({
                title: '错误',
                template: ret.errMsg
            });
            return;
        }
        var fileId = ret.fileId;
        supplier.logo = fileId[0];
        $scope.logoToggle = true;
    }

    $scope.saveSupplier = async function () {
        let supplierName = $scope.supplier.name;
        if(!supplierName){
            msgbox.log("供应商名称不能为空");
            return false;
        }
        if(!$scope.supplier.trafficBookLink){
            msgbox.log("交通预订地址不能为空");
            return false;
        }
        if(!$scope.supplier.hotelBookLink){
            msgbox.log("酒店预订地址不能为空");
            return false;
        }
        let isTrafficUrl = await validator.isURL($scope.supplier.trafficBookLink);
        let isHotelURl = await validator.isURL($scope.supplier.hotelBookLink)
        if(!isTrafficUrl || !isHotelURl){
            msgbox.log("请输入正确的URL地址");
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
