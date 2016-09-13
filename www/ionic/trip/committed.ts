export async function CommittedController($scope, $stateParams, Models){
    let id = $stateParams.id;
    let tripApprove = await Models.tripApprove.get(id);
    $scope.tripApprove = tripApprove;
    console.info($scope.tripApprove);
    $scope.goToDetail = function() {
        window.location.href = `#/trip-approval/detail?approveId=${id}`;
    }
}
