import moment = require('moment');
import UnitOfTime = moment.UnitOfTime;

export async function StaffSavedRankController($scope) {
    require('./staffSavedRank.scss');
    API.require('tripPlan');
    await API.onload();
    $scope.isMonth = true;
    $scope.isYear = false;
    $scope.isAll = false;
    $scope.staffSaves = [];
    $scope.searchStaffSaves = searchStaffSaves;

    async function searchStaffSaves(type: string) {
        let formatStr = 'YYYY-MM-DD HH:mm:ss';
        let options: any = {limit: 10};
        $scope.isMonth = $scope.isYear = $scope.isAll = false;
        $scope[type] = true;
        
        if(!$scope.isAll) {
            let typeStr = $scope.isMonth ? 'month' : 'year';
            options.startTime = moment().startOf(typeStr as UnitOfTime).format(formatStr);
            options.endTime = moment().endOf(typeStr as UnitOfTime).format(formatStr);
        }

        $scope.staffSaves = await API.tripPlan.tripPlanSaveRank(options);
    }

    searchStaffSaves('isMonth');
}