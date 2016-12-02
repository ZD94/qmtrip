import { NoticeAccount, ESendType } from 'api/_types/notice';
import { Staff } from 'api/_types/staff/staff';
import moment = require("moment");

export async function DetailController($scope, Models, $stateParams) {
    var staff = await Staff.getCurrent();
    var notice = await Models.notice.get($stateParams.noticeId);
    //标记为已读
    var noticeAccounts = await Models.noticeAccount.find({where: {accountId: staff.id, noticeId: notice.id}});
    if(noticeAccounts && noticeAccounts.length>0 && !noticeAccounts[0].isRead){
        noticeAccounts[0].isRead = true;
        noticeAccounts[0].readTime = moment().toDate();
        await noticeAccounts[0].save();
    }else if(!noticeAccounts || noticeAccounts.length <= 0 && notice.sendType == ESendType.ALL_ACCOUNT){
        var noticeAccount = NoticeAccount.create({noticeId: notice.id, accountId: staff.id, isReady: true, readTime: moment().toDate()});
        await noticeAccount.save();
    }

    $scope.notice = notice;
}
