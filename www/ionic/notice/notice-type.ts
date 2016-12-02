import { ENoticeType } from 'api/_types/notice/notice';
import { Staff } from 'api/_types/staff/staff';
export async function NoticeTypeController($scope, Models, $stateParams) {
    require('./notice-type.scss');
    //待改进 后端写sql分组统计查询
    var num1 = 0;
    var num2 = 0;
    var num3 = 0;
    var num4 = 0;

    var staff = await Staff.getCurrent();
    var allNotices = await staff.getSelfNotices();
    $scope.ENoticeType = ENoticeType;
    allNotices = await Promise.all(allNotices.map(async function(notice){
        //有待查证
        var noticeAccounts = await Models.noticeAccount.find({where: {accountId: staff.id, noticeId: notice.id}});
        if(noticeAccounts && noticeAccounts.length>0){
            notice["isRead"] = noticeAccounts[0].isRead;
        }
        if(!notice.isRead){
            switch(notice.type){
                case ENoticeType.SYSTEM_NOTICE:
                    num1 += 1;
                    break;
                case ENoticeType.TRIP_APPROVE_NOTICE:
                    num2 += 1;
                    break;
                case ENoticeType.TRIP_APPLY_NOTICE:
                    num3 += 1;
                    break;
                case ENoticeType.ACTIVITY_NOTICE:
                    num4 += 1;
                    break;
            }
        }
        //有待查证
        return notice;
    }));
    //待改进 后端写sql分组统计查询

    var noticeTypes = [
        {name: "系统通知", value: ENoticeType.SYSTEM_NOTICE, unReadNum: num1},
        {name: "出差审批通知", value: ENoticeType.TRIP_APPROVE_NOTICE, unReadNum: num2},
        {name: "出差请示", value: ENoticeType.TRIP_APPLY_NOTICE, unReadNum: num3},
        {name: "精彩活动", value: ENoticeType.ACTIVITY_NOTICE, unReadNum: num4}
    ];
    $scope.noticeTypes = noticeTypes;
    $scope.goList = async function(type){
        window.location.href = '#/notice/index?type='+type
    };
}
