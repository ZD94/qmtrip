import { EPlanStatus } from 'api/_types/tripPlan';
import { Staff } from 'api/_types/staff/staff';
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
            EPlanStatus.COMPLETE,
            EPlanStatus.NO_BUDGET,
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
    loadTripPlan(pager);
    var vm = {
        hasNextPage: function() {
            return pager.totalPages-1 > pager.curPage;
        },
        nextPage : async function() {
            try {
                pager = await pager.nextPage();
            } catch(err) {
                alert("获取数据时,发生异常");
                return;
            } finally {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }
        }
    }

    $scope.vm = vm;

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

