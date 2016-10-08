import moment = require("moment");

export default async function IndexController($scope) {
    require('./statistics.scss');
    API.require("tripPlan");
    var now = moment();
    var data = $scope.data = {
        monthSelection: {
            startTime: now.startOf('month').toDate(),
            endTime: now.add(1, 'month').startOf('month').toDate(),
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
        $scope.saveMoneyChart.data = [$scope.statistic.savedMoney || 0, $scope.statistic.expenditure || 1];
        $scope.$applyAsync();
    }

    $scope.$watch('data.monthSelection',function (o,n) {
        // if(o!=n){
        //     console.log(data.monthSelection);
        // }
        searchData();
    },true);

}
