import {Staff} from "api/_types/staff/staff";
import {ESupplierType} from "api/_types/company/supplier";
var msgbox = require('msgbox');

export async function SelectSupplierController($scope, Models, $stateParams){
    require('./reserve.scss');
    //公共的供应商
    var suppliers = await Models.supplier.find({where:{companyId: null,type: ESupplierType.SYSTEM_CAN_IMPORT}});
    let currentStaff = await Staff.getCurrent();
    $scope.suppliers = suppliers;

    $scope.queryOrders = async function(id){
        let binded = await currentStaff.getOneStaffSupplierInfo({supplierId:id});
        console.info('binded',binded);
        if(binded == null){
            msgbox.log('请先绑定账号')
        }else{
            window.location.href = "#/trip/orders?detailId="+$stateParams.detailId+"&supplierId="+id;
        }
    }
}
