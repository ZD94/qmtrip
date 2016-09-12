import { Staff } from '../../../api/_types/staff/staff';

export async function AccordhotelController($scope, Models, $location) {
    require('./accordhotel.scss');
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var accordHotels = await Models.accordHotel.find({where: {companyId: company.id}});
    $scope.accordHotels = accordHotels;
    $scope.editaccordhotel = async function (id) {
        $location.path('/company/editaccordhotel').search({'accordHotelId': id}).replace();
    }
}
