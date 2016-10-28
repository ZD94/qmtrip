/**
 * Created by seven on 2016/10/27.
 */
"use strict";
import {StaffSupplierInfo} from "api/_types/staff/staff-supplier-info";

export async function BindOthersController($scope, Models){
    $scope.saveOtherAccount = function(){
        var supplier = StaffSupplierInfo.create();
        console.info('supplier',supplier);
    }
}