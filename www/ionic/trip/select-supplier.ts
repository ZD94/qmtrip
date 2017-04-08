import {Staff} from "_types/staff/staff";
import {ESupplierType} from "_types/company/supplier";
import { selectSuppliers } from '../staff/bind-suppliers'
var msgbox = require('msgbox');

export async function SelectSupplierController($scope, Models, $stateParams, ngModalDlg){
    require('./select-supplier.scss');
    //公共的供应商
    let currentStaff = await Staff.getCurrent();

    async function ifBind(){
        var alreadyBinds = await Models.staffSupplierInfo.find({where: {staffId: currentStaff.id}});
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
    $scope.queryOrders = async function(id){
        let hasBinded = await currentStaff.getOneStaffSupplierInfo({supplierId:id});
        if(hasBinded){
            window.location.href = "#/trip/orders?detailId="+$stateParams.detailId+"&supplierId="+id;
        }else{
            let bind = await selectSuppliers($scope, {id:id}, ngModalDlg);
            if(bind == 'bind'){
                ifBind();
                msgbox.log('绑定成功');
            }
        }
        
    }
}
