import moment = require("moment");

export default async function IndexController($scope, $ionicModal, ngModalDlg) {
    require('./statistics.scss');
    API.require("tripPlan");
    await API.onload();
    let formatStr = 'YYYY-MM-DD HH:mm:ss';

    let monthSelection = getSpanSelection('month');
    $scope.monthSelection = monthSelection;
    $scope.beginTime = $scope.monthSelection.startTime;
    $scope.endTime = $scope.monthSelection.endTime;

    $scope.saveMoneyChart = {};
    $scope.saveMoneyChart.labels = ["本月节省", "本月支出"];
    $scope.saveMoneyChart.options = {cutoutPercentage: 70};
    $scope.saveMoneyChart.dataset = {backgroundColor: ['#4A90E2', '#B9C9DB'], borderWidth: [1, 1]};

    await searchData();

    async function searchData() {
        let month = $scope.monthSelection;
        let startTime = moment(month.startTime).format(formatStr);
        let endTime = moment(month.endTime).format(formatStr);
        let statistic = await API.tripPlan.statisticTripBudget({startTime: startTime, endTime: endTime});
        $scope.statistic = statistic;
        $scope.saveMoneyChart.data = [statistic.savedMoney || 0, statistic.expenditure || 1];
    }

    //新添加的----------------------------------------------shicong
    //摸态框的调用
    $scope.showmadel = function(){
        $scope.modal.show();
    }
    $scope.modal = $ionicModal.fromTemplate(require('./spanchange.html'), {
        scope: $scope,
        animation: 'slide-in-up'
    })

    //更改时间间隔
    var span_depend = 'month';
    let lastClick = 'month';
    $scope.isweek = false;
    $scope.ismonth = true;
    $scope.isquarter = false;
    $scope.isyear = false;
    $scope.changespan = function(span){
        if(lastClick){
            let last = 'is' + lastClick;
            $scope[last] = false;
        }
        let nowClick = 'is' + span;
        $scope[nowClick] = true;

        let spanSelection = getSpanSelection(span);
        span_depend = span;
        $scope.monthSelection = spanSelection;
        lastClick = span;
        $scope.beginTime = $scope.monthSelection.startTime;
        $scope.endTime = $scope.monthSelection.endTime;
        $scope.modal.hide();
    }
    //改写monthChange函数 改变时间

    $scope.monthChange = async function(isAdd?: boolean) {
        let optionFun = isAdd ? 'add' : 'subtract';
        let querySpan = moment( $scope.monthSelection.month)[optionFun](1, span_depend);
        $scope.monthSelection = getSpanSelection(span_depend,querySpan);
        $scope.beginTime = $scope.monthSelection.startTime;
        $scope.endTime = $scope.monthSelection.endTime;
        await searchData();
    };
    function getSpanSelection(span_depend,querySpan = moment()){
        let spanSelections = {
                month: querySpan.format('YYYY-MM-DD'),
                startTime: querySpan.startOf(span_depend).toDate(),
                endTime: querySpan.endOf(span_depend).toDate()
            }
        return spanSelections;
    }
    //自定义选择日期
    $scope.selfdefine = false;

    $scope.selfDefineFun = async function(){


        let value = {
            begin:moment().startOf('month').subtract(12,'month').toDate(),
            end:moment().endOf('month').toDate()
        }
        value = await ngModalDlg.selectDateSpan($scope, {
            beginDate:value.begin,
            endDate: value.end,
            timepicker: true,
            title: '选择开始时间',
            titleEnd: '选择结束时间',
            fromStatistic: true
        }, value);
        let selfSelection = {
            month: moment().format('YYYY-MM'),
            startTime: moment(value.begin).toDate(),
            endTime: moment(value.end).toDate()
        };
        $scope.monthSelection = selfSelection;
        if(value){
            $scope.beginTime = value.begin;
            $scope.endTime = value.end;
        }
        $scope.modal.hide();
    }
}
