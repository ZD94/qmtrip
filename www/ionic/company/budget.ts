import moment = require("moment");

export async function BudgetController($scope, $ionicModal, ngModalDlg) {
    require('./statistics.scss');
    API.require("tripPlan");
    await API.onload();
    let formatStr = 'YYYY-MM-DD HH:mm:ss';

    let monthSelection = {
        month: moment().format('YYYY-MM'),
        startTime: moment().startOf('month').format(formatStr),
        endTime: moment().endOf('month').format(formatStr),
        showStr: `${moment().startOf('month').format('YYYY.MM.DD')}-${moment().endOf('month').format('YYYY.MM.DD')}`
    };
    $scope.monthSelection = monthSelection;

    // $scope.monthChange = async function(isAdd?: boolean) {
    //     let optionFun = isAdd ? 'add' : 'subtract';
    //     let queryMonth = moment( $scope.monthSelection.month)[optionFun](1, 'month');
    //     let monthSelection = {
    //         month: queryMonth.format('YYYY-MM'),
    //         startTime: queryMonth.startOf('month').format(formatStr),
    //         endTime: queryMonth.endOf('month').format(formatStr),
    //         showStr: `${queryMonth.startOf('month').format('YYYY.MM.DD')}-${queryMonth.endOf('month').format('YYYY.MM.DD')}`
    //     };
    //     $scope.monthSelection = monthSelection;
    //     await searchData();
    // };

    $scope.saveMoneyChart = {};
    $scope.saveMoneyChart.labels = ["本月节省", "本月支出"];
    $scope.saveMoneyChart.options = {cutoutPercentage: 70};
    $scope.saveMoneyChart.dataset = {backgroundColor: ['#4A90E2', '#B9C9DB'], borderWidth: [1, 1]};

    await searchData();

    async function searchData() {
        let month = $scope.monthSelection;
        let statistic = await API.tripPlan.statisticTripBudget({startTime: month.startTime, endTime: month.endTime});
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
    $scope.changespan = function(span){
        let spanSelection = {
            month: moment().format('YYYY-MM-DD'),
            startTime: moment().startOf(span).format(formatStr),
            endTime: moment().endOf(span).format(formatStr),
            showStr: `${moment().startOf(span).format('YYYY.MM.DD')}-${moment().endOf(span).format('YYYY.MM.DD')}`
        }
        span_depend = span;
        if(span == 'season'){
            let monthNow = moment().month();
            let startMonth = getSeason(monthNow)[0];
            let endMonth = getSeason(monthNow)[1];
            let seasonSelection = {
                month: moment().format('YYYY-MM-DD'),
                startTime: moment().startOf('month').month(startMonth).format(formatStr),
                endTime: moment().endOf('month').month(endMonth).format(formatStr),
                showStr: `${moment().startOf('month').month(startMonth).format('YYYY.MM.DD')}-${moment().endOf('month').month(endMonth).format('YYYY.MM.DD')}`
            }
            $scope.monthSelection = seasonSelection;
        }else{
            $scope.monthSelection = spanSelection;
        }
        $scope.modal.hide();
    }
    //改写monthChange函数 改变时间

    $scope.monthChange = async function(isAdd?: boolean) {
        let optionFun = isAdd ? 'add' : 'subtract';
        let querySpan = moment( $scope.monthSelection.month)[optionFun](1, span_depend);
        if(span_depend == 'season'){
            let queryMonth = moment( $scope.monthSelection.month)[optionFun](3, 'month');
            let nowMonth = moment($scope.monthSelection.month).month();
            if(isAdd){
                if(nowMonth >= 9){
                    nowMonth = nowMonth+3-12;
                }else{
                    nowMonth += 3;
                }
            }else{
                if(nowMonth <= 2){
                    nowMonth = nowMonth-3+12;
                }else{
                    nowMonth -= 3;
                }
            }
            let startAndEndSeason = getSeason(nowMonth);
            let seasonSelection = {
                month: queryMonth.format('YYYY-MM-DD'),
                startTime: queryMonth.startOf('month').month(startAndEndSeason[0]).format(formatStr),
                endTime: queryMonth.endOf('month').month(startAndEndSeason[1]).format(formatStr),
                showStr: `${queryMonth.startOf('month').month(startAndEndSeason[0]).format('YYYY.MM.DD')}-${queryMonth.endOf('month').month(startAndEndSeason[1]).format('YYYY.MM.DD')}`
            };
            $scope.monthSelection = seasonSelection;
        }else{
            $scope.monthSelection = getSpanSelection(querySpan,span_depend);
        }
        await searchData();
    };
    function getSpanSelection(querySpan,span_depend){
        let spanSelections = {
            month: querySpan.format('YYYY-MM-DD'),
            startTime: querySpan.startOf(span_depend).format(formatStr),
            endTime: querySpan.endOf(span_depend).format(formatStr),
            showStr: `${querySpan.startOf(span_depend).format('YYYY.MM.DD')}-${querySpan.endOf(span_depend).format('YYYY.MM.DD')}`
        }
        return spanSelections;
    }
    function getSeason(nowMonth){
        let startMonth;
        let endMonth;
        if(nowMonth <= 2){
            startMonth = 0;
            endMonth = 2
        }else if(nowMonth <= 5){
            startMonth = 3;
            endMonth = 5
        }else if(nowMonth <= 8){
            startMonth = 6;
            endMonth = 8
        }else{
            startMonth = 9;
            endMonth = 11
        }
        return [startMonth,endMonth];
    }

    //自定义选择日期
    $scope.selfdefine = false;
    $scope.beginTime = moment().startOf('month').format('YYYY-MM-DD');
    $scope.endTime = moment().endOf('month').format('YYYY-MM-DD');
    $scope.selfDefineFun = async function(){
        let value = {
            begin:$scope.monthSelection.startTime,
            end:$scope.monthSelection.endTime
        }
        value = await ngModalDlg.selectDateSpan($scope, {
            beginDate:moment(value.begin),
            endDate: moment(value.end),
            timepicker: true,
            title: '选择开始时间',
            titleEnd: '选择结束时间'
        }, value);
        let selfSelection = {
            month: moment().format('YYYY-MM'),
            startTime: moment(value.begin).format(formatStr),
            endTime: moment(value.end).format(formatStr),
            showStr: `${moment(value.begin).format('YYYY.MM.DD')}-${moment(value.end).format('YYYY.MM.DD')}`
        };
        $scope.monthSelection = selfSelection;
        if(value){
            $scope.beginTime = value.begin;
            $scope.endTime = value.end;
        }
        $scope.modal.hide();
    }
}
