import { Department } from 'api/_types/department';
import { Staff, EStaffRoleNames } from 'api/_types/staff/staff';
var msgbox = require('msgbox');

export async function IndexController($scope, $stateParams, Models, $ionicPopup, $ionicListDelegate) {
    require('./department.scss');
    let departmentId = $stateParams.departmentId;
    let staff = await Staff.getCurrent();
    let company = staff.company;
    let rootDepartment : Department;
    if(departmentId){
        rootDepartment = await Models.department.get(departmentId);
    }else{
        rootDepartment = await company.getRootDepartment();
    }
    $scope.rootDepartment = rootDepartment;

    let departments = await rootDepartment.getChildDeptStaffNum();
    let staffs = await rootDepartment.getStaffs();
    $scope.departments = departments;
    $scope.staffs = staffs;
    $scope.EStaffRoleNames = EStaffRoleNames;

    $scope.goChildDept = function(id){
        window.location.href = '#/department/index?departmentId=' + id;
    }
}