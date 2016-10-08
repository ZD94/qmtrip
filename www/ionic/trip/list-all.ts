
import moment = require('moment');
import { Staff } from 'api/_types/staff/staff';
import { EPlanStatus } from 'api/_types/tripPlan';

export default async function ListAllController($scope, $stateParams) {
    require('../statistics/statistics.scss')
    let keyword = $stateParams.keyword || '';
    let type = $stateParams.type || null;
    let staff = await Staff.getCurrent();
    let company = staff.company;
    $scope.EPlanStatus = EPlanStatus;

    let formatStr = 'YYYY-MM-DD HH:mm:ss';
    let monthSelection = {
        keyWord: keyword,
        month: moment().format('YYYY-MM'),
        startTime: moment().startOf('month').format(formatStr),
        endTime: moment().endOf('month').format(formatStr),
        showStr: `${moment().startOf('month').format('YYYY.MM.DD')}-${moment().endOf('month').format('YYYY.MM.DD')}`
    };
    $scope.monthSelection = monthSelection;

    $scope.monthChange = async function(isAdd?: boolean) {
        let optionFun = isAdd ? 'add' : 'subtract';
        let queryMonth = moment( $scope.monthSelection.month)[optionFun](1, 'month');
        let monthSelection = {
            keyWord: $scope.monthSelection.keyWord,
            month: queryMonth.format('YYYY-MM'),
            startTime: queryMonth.startOf('month').format(formatStr),
            endTime: queryMonth.endOf('month').format(formatStr),
            showStr: `${queryMonth.startOf('month').format('YYYY.MM.DD')}-${queryMonth.endOf('month').format('YYYY.MM.DD')}`
        };
        $scope.monthSelection = monthSelection;
        await searchTripPlans();
    };

    $scope.enterDetail = function(trip){
        if (!trip) return;
        window.location.href = `#/trip/detail?tripid=${trip.id}`;
    };

    async function searchTripPlans(newVal?: string, oldVal?: string) {
        let monthSelection = $scope.monthSelection;
        let keyWord = monthSelection.keyWord;
        let status = [EPlanStatus.AUDIT_NOT_PASS, EPlanStatus.AUDITING, EPlanStatus.COMPLETE, EPlanStatus.NO_BUDGET, EPlanStatus.WAIT_COMMIT, EPlanStatus.WAIT_UPLOAD];
        $scope.tripPlans = [];

        let options: any = {where: {
            startTime: monthSelection.startTime,
            endTime: monthSelection.endTime,
            status: {$in: status}
        }};

        if(keyWord) {
            options.where.$or = [];
            if(!type || (type == 'P')) //不指定任何检索条件或者指定按项目检索关键字
                options.where.$or.push({title: {$like: `%${keyWord}%`}});

            let staffOpt: any = {where: {$or: []}};

            if(!type || type == 'D'){
                let depts = await company.getDepartments({where: {name: {$like: `%${keyWord}%`}}});
                let deptIds = depts.map((d) => d.id);
                if(deptIds && deptIds.length > 0)
                    staffOpt.where.$or.push({departmentId: deptIds});
            }

            if(!type || type =='S' || type == 'D'){
                if(!type || type == 'S')
                    staffOpt.where.$or.push({name: {$like: `%${keyWord}%`}});
                let staffs = await company.getStaffs(staffOpt);
                if(staffs && staffs.length > 0)
                    options.where.$or.push({accountId: staffs.map((s) => s.id)});
            }
        }
        var pager = await company.getTripPlans(options);

        $scope.pager = pager;
        loadTripPlans(pager);

        $scope.vm = {
            isHasNextPage:pager.hasNextPage(),
            nextPage : async function() {
                if(!pager.hasNextPage()){
                    $scope.vm.isHasNextPage = false;
                    return;
                }
                await pager.nextPage();
                $scope.vm.isHasNextPage = pager.hasNextPage();
                loadTripPlans(pager);
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }
        };

        function loadTripPlans(pager) {
            pager.forEach(function(obj){
                $scope.tripPlans.push(obj);
            });
        }

    }

    $scope.$watch("monthSelection.keyWord", searchTripPlans);
}
