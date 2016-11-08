import { Staff } from 'api/_types/staff/staff';
import { ESupplierType } from 'api/_types/company/supplier';

export * from './edit';

export async function IndexController($scope, Models, $location) {
    require('./accord-hotel.scss');
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var suppliers = await company.getCompanySuppliers();
    $scope.suppliers = suppliers;

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

    //是否让员工自主选择
    let assignSupplier = company.isAppointSupplier;
    $scope.assignSupplier = assignSupplier;
    $scope.toggleAssignSupplier = async function(assignSupplier){
        company.isAppointSupplier = assignSupplier;
        await company.save();
    }
    //自定义供应商
    $scope.saveSupplierStatus = async function(ah){
        await ah.save();
    }

    $scope.savePublicSupplierStatus = async function(e){
        if(e.isPointed){
            appointedPubilcSuppliers.push(e.id);
        }else{
            let index = appointedPubilcSuppliers.indexOf(e.id);
            appointedPubilcSuppliers.splice(index,1);
        }
        company.appointedPubilcSuppliers = JSON.stringify(appointedPubilcSuppliers);
        await company.save();
    }
    $scope.editSupplier = async function (id) {
        window.location.href = "#/supplier/edit?supplierId=" + id;
    }
    $scope.addSupplier = async function () {
        window.location.href = "#/supplier/edit";
    }
}
