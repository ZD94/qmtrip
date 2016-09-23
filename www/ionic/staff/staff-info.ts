import { Staff } from 'api/_types/staff/staff';
export async function StaffInfoController($scope, Models) {
    require('./staff-info.scss');
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.company = await staff.company;
    $scope.department = await staff.department;
    $scope.travelpolicy = await staff.getTravelPolicy(staff['travelPolicyId']);
    $scope.staffRole = ['创建者','员工','管理员','财务'];
}
