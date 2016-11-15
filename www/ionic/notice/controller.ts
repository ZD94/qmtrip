import { Staff } from 'api/_types/staff/staff';

export * from './detail';

export async function IndexController($scope, Models, $location) {
    var staff = await Staff.getCurrent();
    var notices = await staff.getSelfNotices();
    $scope.notices = notices;
    $scope.detail = async function (id) {
        // $location.path('/accord-hotel/edit').search({'accordHotelId': id}).replace();
        window.location.href = "#/notice/detail?noticeId=" + id;
    }
}
