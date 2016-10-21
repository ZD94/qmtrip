import { Staff } from 'api/_types/staff/staff';

export * from './edit';

export async function IndexController($scope, Models, $location) {
    require('./accord-hotel.scss');
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var suppliers = await company.getCompanySuppliers();
    $scope.suppliers = suppliers;
    $scope.editSupplier = async function (id) {
        window.location.href = "#/supplier/edit?supplierId=" + id;
    }
}
