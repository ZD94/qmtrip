import { Staff } from 'api/_types/staff/staff';

export * from './edit';

export async function IndexController($scope, Models, $location) {
    require('./accord-hotel.scss');
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var accordHotels = await Models.accordHotel.find({where: {companyId: company.id}});
    $scope.accordHotels = accordHotels;
    $scope.editaccordhotel = async function (id) {
        $location.path('/company/editaccordhotel').search({'accordHotelId': id}).replace();
    }
}