import moment = require('moment');

export default async function StaffSavedRankController($scope) {
    require('./staff-saved-rank.scss');
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
            let typeStr: moment.unitOfTime.StartOf = $scope.isMonth ? 'month' : 'year';
            options.startTime = moment().startOf(typeStr).format(formatStr);
            options.endTime = moment().endOf(typeStr).format(formatStr);
        }

        $scope.staffSaves = await API.tripPlan.tripPlanSaveRank(options);
    }

    searchStaffSaves('isMonth');
}