import { ETripType, EInvoiceType } from 'api/_types/tripPlan';
import moment = require('moment');
export async function DetailController($scope, $stateParams, Models, $location){
    require('./trip.scss');
    let id = $stateParams.id;
    if (!id) {
        $location.path("/");
        return;
    }
    let tripPlan = await Models.tripPlan.get(id);
    let budgets: any[] = await Models.tripDetail.find({where: {tripPlanId: id}});
    $scope.createdAt = moment(tripPlan.createAt).toDate();
    $scope.startAt = moment(tripPlan.startAt).toDate();
    $scope.backAt = moment(tripPlan.backAt).toDate();

    $scope.trip = tripPlan.target;
    $scope.budgets = budgets;
    $scope.EInvoiceType = EInvoiceType;
    $scope.ETripType = ETripType;
}
