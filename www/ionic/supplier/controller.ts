import { Staff } from 'api/_types/staff/staff';

export * from './edit';

export async function IndexController($scope, Models, $location) {
    require('./accord-hotel.scss');
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var suppliers = await company.getCompanySuppliers();
    $scope.suppliers = suppliers;
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
    //公共的供应商
    var publicSuppliers = await Models.supplier.find({where:{companyId: null}});
    $scope.publicSuppliers = publicSuppliers;
    let appointedPubilcSuppliers = await company.appointedPubilcSuppliers;
    if(typeof appointedPubilcSuppliers == 'string'){
        appointedPubilcSuppliers = JSON.parse(appointedPubilcSuppliers)
    }
    $scope.appointedPubilcSuppliers = appointedPubilcSuppliers;
    for(let i=0;i<publicSuppliers.length;i++){
        let id = publicSuppliers[i].id;
        for(let j=0;j<appointedPubilcSuppliers.length;j++){
            if(appointedPubilcSuppliers[j] == id){
                publicSuppliers[i].isInUse = true;
            }
        }
    }
    $scope.savePublicSupplierStatus = async function(e){
        if(e.isInUse){
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
