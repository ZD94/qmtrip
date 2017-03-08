import { Staff } from 'api/_types/staff/staff';

export * from './edit';

export async function IndexController($scope, Models, $location,CNZZ) {
    require('./accord-hotel.scss');
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    CNZZ.addEvent("协议酒店管理","点击","进入协议酒店管理",staff);
    var accordHotels = await Models.accordHotel.find({where: {companyId: company.id}});
    $scope.accordHotels = accordHotels;
    $scope.editaccordhotel = async function (id) {
        // $location.path('/accord-hotel/edit').search({'accordHotelId': id}).replace();
        window.location.href = "#/accord-hotel/edit?accordHotelId=" + id;
    }
}
