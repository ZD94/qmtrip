import { QMEApproveStatus, EApproveResult2Text } from 'api/_types/tripPlan';
export async function ApproveProgressController ($scope, Models, $stateParams){
    require('./approve-progress.scss');
    let approveId = $stateParams.approveId;
    let tripApprove = await Models.tripApprove.get(approveId);
    $scope.tripApprove = tripApprove;
    $scope.$watch('tripApprove.status', function(n, o){
        getLogs ();
    });
    $scope.EApproveStatus = QMEApproveStatus;
    $scope.APPROVE_LOG_TEXT = EApproveResult2Text;
    async function getLogs (){
        let logs = await tripApprove.getApproveLogs();
        logs = await Promise.all(logs.map(async (a) => {
            a.staff = await Models.staff.get(a.userId)
            return a;
        }));
        $scope.logs = logs;
    }
}
