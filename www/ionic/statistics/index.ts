import moment = require("moment");

export default async function IndexController($scope) {
    require('./statistics.scss');
    API.require("tripPlan");
    let formatStr = 'YYYY-MM-DD HH:mm:ss';
    var now = moment();
    var data = $scope.data = {
        monthSelection: {
            startTime: now.startOf('month').toDate(),
            endTime: now.startOf('month').add(1, 'months').subtract(1, 'days').toDate(),
        }
    };
    $scope.statistic = {};

    $scope.saveMoneyChart = {};
    $scope.saveMoneyChart.labels = ["本月节省", "本月支出"];
    $scope.saveMoneyChart.options = {cutoutPercentage: 70};
    $scope.saveMoneyChart.dataset = {backgroundColor: ['#4A90E2', '#B9C9DB'], borderWidth: [1, 1]};

    async function searchData() {
        await API.onload();
        $scope.statistic = await API.tripPlan.statisticTripBudget(data.monthSelection);
        $scope.saveMoneyChart.data = [
            $scope.statistic.savedMoney || 0,
            ($scope.statistic.completeBudget || 1)-($scope.statistic.savedMoney || 0)
        ];
        $scope.$applyAsync();
    }

    $scope.staffTripRecord = function(){
        let sTime = moment($scope.data.monthSelection.startTime).format(formatStr);
        let eTime = moment($scope.data.monthSelection.endTime).format(formatStr);
        window.location.href = `#/trip/list-all?sTime=${sTime}&eTime=${eTime}`
    }

    $scope.$watch('data.monthSelection',function (o,n) {
        // if(o!=n){
        //     console.log(data.monthSelection);
        // }
        searchData();
    },true);

}
