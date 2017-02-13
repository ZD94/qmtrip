
import moment = require('moment');

export default async function BudgetController($scope, $stateParams, Models) {
    require('./statistics.scss');
    API.require('tripPlan');

    let type = $stateParams.type;
    let formatStr = 'YYYY-MM-DD HH:mm:ss';
    // let monthSelection = {
    //     type: type,
    //     month: moment().format('YYYY-MM'),
    //     startTime: moment().startOf('month').format(formatStr),
    //     endTime: moment().endOf('month').format(formatStr),
    //     showStr: `${moment().startOf('month').format('YYYY.MM.DD')}-${moment().endOf('month').format('YYYY.MM.DD')}`
    // };
    // $scope.monthSelection = monthSelection;
    //
    // $scope.monthChange = async function(isAdd?: boolean) {
    //     let optionFun = isAdd ? 'add' : 'subtract';
    //     let queryMonth = moment( $scope.monthSelection.month)[optionFun](1, 'month');
    //     let monthSelection = {
    //         type: $scope.monthSelection.type,
    //         month: queryMonth.format('YYYY-MM'),
    //         startTime: queryMonth.startOf('month').format(formatStr),
    //         endTime: queryMonth.endOf('month').format(formatStr),
    //         showStr: `${queryMonth.startOf('month').format('YYYY.MM.DD')}-${queryMonth.endOf('month').format('YYYY.MM.DD')}`
    //     };
    //     $scope.monthSelection = monthSelection;
    //     await initData();
    // };
    //修改日历指令
    var now = moment();
    var data = $scope.data = {
        monthSelection: {
            type: type,
            startTime: now.startOf('month').toDate(),
            endTime: now.startOf('month').add(1, 'month').subtract(1, 'days').toDate(),
        }
    };

    $scope.$watch('data.monthSelection',function (o,n) {
        // if(o!=n){
        //     console.log(data.monthSelection);
        // }
        initData();
    },true);


    await searchStatistics(type);

    async function searchStatistics(type) {
        let modelName = '';
        let placeholder;
        let isSActive = false, isPActive = false, isDActive = false;

        switch (type) {
            case 'S':
                placeholder='请输入员工姓名';modelName = 'staff';
                isSActive = true; isPActive = isDActive = false;
                $scope.showManTimes = '次';
                break;
            case 'P':
                placeholder='请输入项目名称';modelName = 'project';
                isPActive = true; isSActive = isDActive = false;
                $scope.showManTimes = '人次';
                break;
            case 'D':
                placeholder='请输入部门名称';modelName = 'department';
                isDActive = true; isSActive = isPActive = false;
                $scope.showManTimes = '人次';
                break;
            default: break;
        }

        $scope.isSActive = isSActive;
        $scope.isPActive = isPActive;
        $scope.isDActive = isDActive;
        $scope.modelName = modelName;
        $scope.placeholder = placeholder;
        $scope.data.monthSelection.type = type;
        await initData();
    }

    async function initData() {
        await API.onload();
        let startTime = moment($scope.data.monthSelection.startTime).format(formatStr);
        let endTime = moment($scope.data.monthSelection.endTime).format(formatStr);
        let obj = {
            type: $scope.data.monthSelection.type,
            startTime: startTime,
            endTime: endTime,
            keyWord: $scope.data.monthSelection.keyWord,
        }
        console.info(obj);
        let ret = await API.tripPlan.statisticBudgetsInfo(obj);
        ret = await Promise.all(ret.map(async (s) => {
            s.keyInfo = await Models[$scope.modelName].get(s.typeKey);
            return s;
        }));
        $scope.statisticData = ret;
    }

    $scope.goToStaffRecords = function(name) {
        let sTime = moment($scope.data.monthSelection.startTime).format(formatStr);
        let eTime = moment($scope.data.monthSelection.endTime).format(formatStr);
        window.location.href = `#/trip/list-all?type=${$scope.data.monthSelection.type}&keyword=${name}&sTime=${sTime}&eTime=${eTime}`;
    };

    $scope.searchStatistics = searchStatistics;
}
