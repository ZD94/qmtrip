import {StaffSupplierInfo} from "api/_types/staff/staff-supplier-info";
import { Staff } from 'api/_types/staff/staff';
import { ESupplierType } from 'api/_types/company/supplier';

export async function BindSuppliersController($scope, Models){
    var staff = await Staff.getCurrent();
    var alreadyBinds = await Models.staffSupplierInfo.find({where: {staffId: staff.id}});
    var suppliers = await Models.supplier.find({where: {companyId: null, type: ESupplierType.SYSTEM_CAN_IMPORT}});
    if(alreadyBinds && alreadyBinds.length > 0){
        suppliers.map(function(s){
            alreadyBinds.forEach(function(item){
                if(s.id == item.supplier.id){
                    s["isBind"] = true;
                }
            })
            return s;
        })
    }
    $scope.suppliers = suppliers;
    $scope.bindSupplier = function (id) {
        window.location.href = `#/staff/bind-others?supplierId=${id}`;
    }
}