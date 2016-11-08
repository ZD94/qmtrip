import {StaffSupplierInfo} from "api/_types/staff/staff-supplier-info";
import { Staff } from 'api/_types/staff/staff';
import { ESupplierType } from 'api/_types/company/supplier';

var msgbox = require('msgbox');
export function selectSuppliers($scope, id, ngModalDlg){
    return ngModalDlg.createDialog({
        parent: $scope,
        scope: {id},
        template: require('./bind-account.html'),
        controller: bindSupplierController
    })
}


export async function BindSuppliersController($scope, Models, ngModalDlg){
    var staff = await Staff.getCurrent();
    async function ifBind(){
        var alreadyBinds = await Models.staffSupplierInfo.find({where: {staffId: staff.id}});
        var suppliers = await Models.supplier.find({where: {companyId: null, type: ESupplierType.SYSTEM_CAN_IMPORT}});
        if(alreadyBinds && alreadyBinds.length > 0){
            suppliers.map(function(s){
                alreadyBinds.forEach(function(item){
                    if(s.id == item.supplier.id){
                        s["isBind"] = true;
                    }else{
                        s["isBind"] = false;
                    }
                })
                return s;
            })
        }else{
            suppliers.map(function(s){
                s["isBind"] = false;
            })
        }
        $scope.suppliers = suppliers;
    }
    ifBind();
    $scope.bindSupplier = async function (id) {
        let bind = await selectSuppliers($scope,{id:id}, ngModalDlg)
        if(bind == 'bind'){
            ifBind();
            msgbox.log("绑定成功");
        }else if(bind == 'unbind'){
            ifBind();
            msgbox.log("绑定成功");
        }
        // window.location.href = `#/staff/bind-others?supplierId=${id}`;
    }
}


export async function bindSupplierController($scope, Models, $ionicPopup){
    require('./bind-account.scss');
    $scope.form = {userName:'', pwd: ''};

    var staffSupplierInfo;
    var supplierId = $scope.id.id;
    var staff = await Staff.getCurrent();
    var supplier = await Models.supplier.get(supplierId);
    var alreadyBind = await Models.staffSupplierInfo.find({where: {supplierId: supplierId, staffId: staff.id}});
    $scope.alreadyBind = alreadyBind;
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
            let bind = 'bind';
            $scope.confirmModal(bind);
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
                        let bind = 'unbind';
                        $scope.confirmModal(bind);
                    }
                }
            ]
        })
    }
}