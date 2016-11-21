
export async function DetailController($scope, Models, $stateParams) {
    var notice = await Models.notice.get($stateParams.noticeId);
    if(!notice.isRead){
        notice.isRead = true;
        await notice.save();
    }
    $scope.notice = notice;
}
