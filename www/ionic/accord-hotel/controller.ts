import { Staff } from '_types/staff/staff';

export * from './edit';

export async function IndexController($scope, Models, $location) {
    require('./accord-hotel.scss');
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var accordHotels = await Models.accordHotel.find({where: {companyId: company.id}});
    $scope.accordHotels = accordHotels;
    $scope.editaccordhotel = async function (id) {
        // $location.path('/accord-hotel/edit').search({'accordHotelId': id}).replace();
        window.location.href = "#/accord-hotel/edit?accordHotelId=" + id;
    }
}
