import { NoticeAccount, ESendType } from '_types/notice';
import { Staff } from '_types/staff/staff';
import moment = require("moment");

export async function DetailController($scope, Models, $stateParams) {
    var notice = await Models.notice.get($stateParams.noticeId);
    //标记已读
    await notice.setReadStatus();

    $scope.notice = notice;
}
