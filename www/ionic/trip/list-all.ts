
import moment = require('moment');
import { Staff } from 'api/_types/staff/staff';
import { EPlanStatus } from 'api/_types/tripPlan';

export default async function ListAllController($scope, $stateParams) {
    require('../statistics/statistics.scss')
    let keyword = $stateParams.keyword || '';
    let type = $stateParams.type || null;
    let sTime = $stateParams.sTime;
    let eTime = $stateParams.eTime;

    let formatStr = 'YYYY-MM-DD HH:mm:ss';
    //修改日历指令
    var data = $scope.data = {
        monthSelection: {
            keyWord: keyword,
            startTime: moment(sTime).toDate(),
            endTime: moment(eTime).toDate(),
        }
    };
    let staff = await Staff.getCurrent();
    let company = staff.company;
    $scope.EPlanStatus = EPlanStatus;
    $scope.$watch('data.monthSelection',function (o,n) {
        if(o!=n){
            searchTripPlans();
        }
    },true);



    $scope.enterDetail = function(trip){
        if (!trip) return;
        window.location.href = `#/trip/detail?tripid=${trip.id}`;
    };

    async function searchTripPlans(newVal?: string, oldVal?: string) {
        let startTime = moment($scope.data.monthSelection.startTime).format(formatStr);
        let endTime = moment($scope.data.monthSelection.endTime).format(formatStr);
        let monthSelection = {
            keyWord: $scope.data.monthSelection.keyWord,
            startTime: startTime,
            endTime: endTime
        }



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
                    $scope.$broadcast('scroll.infiniteScrollComplete');
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
                if($scope.tripPlans.indexOf(obj) < 0 ){
                    $scope.tripPlans.push(obj);
                }
            });
        }

    }

    $scope.$watch("data.monthSelection.keyWord", searchTripPlans);
}
