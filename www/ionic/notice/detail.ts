import { NoticeAccount, ESendType } from 'api/_types/notice';
import { Staff } from 'api/_types/staff/staff';
import moment = require("moment");

export async function DetailController($scope, Models, $stateParams) {
    var notice = await Models.notice.get($stateParams.noticeId);
    //标记已读
    await notice.setReadStatus();

    $scope.notice = notice;
}
