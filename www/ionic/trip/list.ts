import { EPlanStatus } from 'api/_types/tripPlan';
import { Staff } from 'api/_types/staff/staff';
import indexOf = require("lodash/indexOf");
export async function ListController($scope , $stateParams, Models){
    var staff = await Staff.getCurrent();
    let statusTxt = {};
    statusTxt[EPlanStatus.AUDIT_NOT_PASS] = "未通过";
    statusTxt[EPlanStatus.NO_BUDGET] = "没有预算";
    statusTxt[EPlanStatus.WAIT_UPLOAD] = "待上传票据";
    statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交";
    statusTxt[EPlanStatus.AUDITING] = "已提交待审核";
    statusTxt[EPlanStatus.COMPLETE] = "已完成";
    $scope.statustext = statusTxt;
    $scope.isHasNextPage = true;
    $scope.tripPlans = [];
    var status = [];
    if($stateParams.status || $stateParams.status == 0){
        status.push($stateParams.status);
    }else{
        status = [
            EPlanStatus.WAIT_UPLOAD,
            EPlanStatus.WAIT_COMMIT,
            EPlanStatus.AUDIT_NOT_PASS,
            // EPlanStatus.COMPLETE,
            EPlanStatus.AUDITING
        ];
    }
    var where: any = {
        status: {$in: status}
    };
    if($stateParams.auditStatus || $stateParams.auditStatus == 0){
        where.auditStatus = $stateParams.auditStatus;
    }
    let pager = await staff.getTripPlans({
        limit: 5,
        where: where
    });
    // loadTripPlan(pager);
    var vm = {
        hasNextPage: function() {
            return pager.totalPages-1 > pager.curPage;
        },
        nextPage : async function() {
            try {
                let newArr =[];
                let join = {};
                pager = await pager.nextPage();
                pager.map(function(item){
                    $scope.tripPlans.push(item);
                })
            } catch(err) {
                alert("获取数据时,发生异常");
                return;
            } finally {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }
        }
    }

    $scope.vm = vm;
    $scope.filter = 'ALL';
    $scope.EPlanStatus = EPlanStatus;

    $scope.changeTo = async function(filter){
        $scope.tripPlans = [];
        if (['WAIT_UPLOAD', 'ALL', 'AUDITING', 'TRIP_FAIL', 'TRIP_SUCCESS'].indexOf(filter) >= 0) {
            $scope.filter = filter;
        }

        let PlanStatus: any = {$notIn: [EPlanStatus.COMPLETE, EPlanStatus.NO_BUDGET]};
        switch(filter) {
            case 'ALL': PlanStatus = {$notIn: [EPlanStatus.COMPLETE, EPlanStatus.NO_BUDGET]};break;
            case 'WAIT_UPLOAD': PlanStatus = {$in: [EPlanStatus.WAIT_UPLOAD, EPlanStatus.WAIT_COMMIT]}; break;
            case 'AUDITING': PlanStatus = EPlanStatus.AUDITING; break;
            case 'TRIP_FAIL': PlanStatus = EPlanStatus.AUDIT_NOT_PASS; break;
            case 'TRIP_SUCCESS': PlanStatus = EPlanStatus.COMPLETE; break;
        }
        let where:any = {
            status: PlanStatus
        }
        pager = await staff.getTripPlans({
            limit: 5,
            where: where
        });
        loadTripPlan(pager);
    };

    await $scope.changeTo($scope.filter);
    $scope.enterdetail = function(trip){
        if (!trip) return;
        window.location.href = "#/trip/list-detail?tripid="+trip.id;
    }

    function loadTripPlan(pager) {
        pager.forEach(function(trip){
            $scope.tripPlans.push(trip);
        });
    }
}

