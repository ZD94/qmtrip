var msgbox = require('msgbox');

export async function DetailController($scope, Models, $stateParams) {
    var notice = await Models.notice.get($stateParams.noticeId);

    $scope.notice = notice;

    $scope.senNotice = async function(notice){
        await notice.sendNotice();
        msgbox.log('发送成功！');
    };

    $scope.deleteNotice = async function(notice){
        if(config("确定要删除吗？")){
            await notice.destroy();
            msgbox.log('发送成功！');
        }
    };
}
