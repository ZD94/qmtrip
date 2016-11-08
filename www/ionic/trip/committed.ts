export async function CommittedController($scope, $stateParams, Models){
    require('./committed.scss');
    let id = $scope.approveId;
    let tripApprove = await Models.tripApprove.get(id);
    $scope.tripApprove = tripApprove;
    console.info($scope.tripApprove);
    $scope.goToDetail = function() {
        $scope.modal.hide();
        window.location.href = `#/trip-approval/detail?approveId=${id}`;
    }
    $scope.goBack = function(){
        $scope.modal.hide();
    }
}
