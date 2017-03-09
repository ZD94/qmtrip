import { QMEApproveStatus, EApproveStatus2Text } from '_types/tripPlan';
import { Staff } from '_types/staff/staff';
export async function ListController($scope, Models, $stateParams, $ionicLoading){
    require('./trip-approval.scss');
    let staff = await Staff.getCurrent();
    const ONE_PAGE_LIMIT = 10;
    let Pager;
    $scope.filter = 'WAIT_APPROVE';
    $scope.EApproveStatus = QMEApproveStatus;
    $scope.tripApproves = [];
    $scope.APPROVE_TEXT = EApproveStatus2Text;
    
    $scope.changeTo = async function(filter) {
        $scope.tripApproves = [];
        if (['WAIT_APPROVE', 'ALL', 'APPROVE_PASS', 'APPROVE_FAIL', 'APPROVING'].indexOf(filter) >= 0) {
            $scope.filter = filter;
        }
        let status: string|number|Object = 'ALL';
        switch(filter) {
            case 'WAIT_APPROVE': status = QMEApproveStatus.WAIT_APPROVE; break;
            case 'APPROVE_PASS': status = QMEApproveStatus.PASS; break;
            case 'APPROVE_FAIL': status = QMEApproveStatus.REJECT; break;
            case 'APPROVING': status = QMEApproveStatus.WAIT_APPROVE; break;
        }
        let where: any = {};
        if (status != 'ALL') where.status = status;
        if(filter == 'ALL' || filter == 'APPROVING')
            where.isApproving = true;
        Pager = await staff.getTripApprovesByApproverUser({ where: where, limit: ONE_PAGE_LIMIT}); //获取待审批出差计划列表
        Pager.forEach(function(v) {
            $scope.tripApproves.push(v);
        })
    };

    $scope.hasNextPage = function() : Boolean{
        if (!Pager) return false;
        return Pager.totalPages - 1 > Pager.curPage;
    };

    await $scope.changeTo($scope.filter);
    
    $scope.loadMore = async function() {
        if (!Pager) {
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
        }
        try {
            Pager = await Pager.nextPage();
            Pager.forEach(function(v) {
                $scope.tripApproves.push(v);
            });
        } catch(err) {
            alert("加载数据发生错误");
        } finally {
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    };

    $scope.enterDetail = function(approveId){
        if (!approveId) return;
        window.location.href = `#/trip-approval/detail?approveId=${approveId}`;
    }
}
