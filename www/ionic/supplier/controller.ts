import { Staff } from 'api/_types/staff/staff';
import { ESupplierType } from 'api/_types/company/supplier';


export async function IndexController($scope, Models, $location) {
    require('./supplier.scss');
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var suppliers = await company.getCompanySuppliers();
    $scope.suppliers = suppliers;
    $scope.ESupplierType = ESupplierType;

    //公共的供应商
    var publicSuppliers = await Models.supplier.find({where:{companyId: null}});
    // $scope.publicSuppliers = publicSuppliers;
    let appointedPubilcSuppliers = await company.appointedPubilcSuppliers;
    if(typeof appointedPubilcSuppliers == 'string'){
        appointedPubilcSuppliers = JSON.parse(appointedPubilcSuppliers)
    }
    $scope.appointedPubilcSuppliers = appointedPubilcSuppliers;
    for(let i=0;i<publicSuppliers.length;i++){
        let id = publicSuppliers[i].id;
        if(appointedPubilcSuppliers.indexOf(id) >= 0){
            publicSuppliers[i].isPointed = true;
        }else{
            publicSuppliers[i].isPointed = false;
        }
    }
    var canImportList  = publicSuppliers.filter((item: any)=>{
        return item.type == ESupplierType.SYSTEM_CAN_IMPORT;
    })
    $scope.canImportList = canImportList;
    var canNotImportList  = publicSuppliers.filter((item: any)=>{
        return item.type == ESupplierType.SYSTEM_CAN_NOT_IMPORT;
    })
    $scope.canNotImportList = canNotImportList;


    $scope.editSupplier = async function () {
        window.location.href = "#/supplier/edit";
    }
}
