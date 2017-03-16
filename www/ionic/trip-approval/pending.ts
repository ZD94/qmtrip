import { QMEApproveStatus} from 'api/_types/tripPlan';
import { Staff } from 'api/_types/staff/staff';
export async function PendingController($scope, $stateParams){
    require('./trip-approval.scss');
    const PAGE_SIZE = 10;
    let staff = await Staff.getCurrent();
    let approveStatus = $stateParams.status;
    let tripApproves = [];
    let Pager;
    if(approveStatus){
        $scope.filter = QMEApproveStatus[approveStatus];
        Pager = await staff.getTripApproves({
            where: {status: approveStatus},
            limit: PAGE_SIZE})
    }else{
        $scope.filter = 'ALL';
        Pager = await staff.getTripApproves({
            where: {status: [QMEApproveStatus.CANCEL, QMEApproveStatus.PASS, QMEApproveStatus.REJECT, QMEApproveStatus.WAIT_APPROVE]},
            limit: PAGE_SIZE})
    }
    var More = {
        hasNextPage: function() {
            return Pager.totalPages-1 > Pager.curPage;
        },
        loadMore: async function(){
            console.info('start');
            console.info(Pager);
            if (!Pager) {
                $scope.$broadcast('scroll.infiniteScrollComplete');
                // return;
            }else{
                try {
                    Pager = await Pager.nextPage();
                    Pager.map(function(v) {
                        try{
                            v.query = JSON.parse(v.query);
                        }catch(e){}
                        
                        $scope.tripApproves.push(v);
                    });
                    $scope.hasNextPage = true;
                } catch (err) {
                    console.info(err);
                    $scope.hasNextPage = false;
                } finally {
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }
            }

        }
    };
    $scope.More = More;
    Pager.forEach((a) => {tripApproves.push(a);});
    $scope.tripApproves = tripApproves;

    // $scope.Pager = Pager;
    $scope.EApproveStatus = QMEApproveStatus;
    $scope.tripApproves = [];
    $scope.changeTo = async function(filter) {
        $scope.tripApproves = [];
        if (['WAIT_APPROVE', 'ALL', 'REJECT', 'PASS'].indexOf(filter) >= 0) {
            $scope.filter = filter;
        }
        //let status: any = {$ne: EApproveStatus.CANCEL};
        let EApproveStatusArray = [QMEApproveStatus.CANCEL, QMEApproveStatus.NO_BUDGET, QMEApproveStatus.REJECT, QMEApproveStatus.WAIT_APPROVE, QMEApproveStatus.PASS]
        let status: any = {$any: EApproveStatusArray};
        switch(filter) {
            //case 'ALL': status = {$ne: EApproveStatus.CANCEL};break;
            case 'ALL': status = {$any: EApproveStatusArray};break;
            case 'WAIT_APPROVE': status = QMEApproveStatus.WAIT_APPROVE; break;
            case 'REJECT': status = QMEApproveStatus.REJECT; break;
            case 'PASS': status = QMEApproveStatus.PASS; break;
        }
        let where: any = {status: status};
        Pager = await staff.getTripApproves({ where: where, limit: PAGE_SIZE}); //获取待审批出差计划列表

        Pager.forEach(function(v) {
            try{
                v.query = JSON.parse(v.query);
            }catch(e){}
            
            $scope.tripApproves.push(v);
        })
    };
    await $scope.changeTo($scope.filter);
    $scope.enterDetail = function(approveId){
        window.location.href = `#/trip-approval/detail?approveId=${approveId}`;
    };
}
