import moment = require("moment");

export default async function IndexController($scope, $ionicModal, ngModalDlg) {
    require('./statistics.scss');
    API.require("tripPlan");
    await API.onload();


    $scope.saveMoneyChart = {};
    $scope.saveMoneyChart.labels = ["本月节省", "本月支出"];
    $scope.saveMoneyChart.options = {cutoutPercentage: 70};
    $scope.saveMoneyChart.dataset = {backgroundColor: ['#4A90E2', '#B9C9DB'], borderWidth: [1, 1]};
    //第一次进入的时候执行一遍
    let formatStr = 'YYYY-MM-DD HH:mm:ss';
    async function searchFirstData() {
        let month = $scope.monthSelection;
        let startTime = moment().startOf('month').format(formatStr);
        let endTime = moment().endOf('month').format(formatStr);
        let statistic = await API.tripPlan.statisticTripBudget({startTime: startTime, endTime: endTime});
        $scope.statistic = statistic;
        $scope.saveMoneyChart.data = [statistic.savedMoney || 0, statistic.expenditure || 1];
    }

    await searchFirstData();
}
