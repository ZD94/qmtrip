import { ENoticeType } from '_types/notice/notice';
import { Staff } from '_types/staff/staff';
export async function NoticeTypeController($scope, Models, $stateParams) {
    require('./notice-type.scss');
    $scope.ENoticeType = ENoticeType;
    var staff = await Staff.getCurrent();
    var statisticInfo = await staff.statisticNoticeByType();

    var noticeTypes = [
        {name: "系统通知", value: ENoticeType.SYSTEM_NOTICE
            , unReadNum: statisticInfo[ENoticeType.SYSTEM_NOTICE] ? statisticInfo[ENoticeType.SYSTEM_NOTICE].unReadNum : 0,
            latestInfo: statisticInfo[ENoticeType.SYSTEM_NOTICE] ? statisticInfo[ENoticeType.SYSTEM_NOTICE].latestInfo: null},
        {name: "出差审批通知", value: ENoticeType.TRIP_APPROVE_NOTICE
            , unReadNum: statisticInfo[ENoticeType.TRIP_APPROVE_NOTICE] ? statisticInfo[ENoticeType.TRIP_APPROVE_NOTICE].unReadNum : 0,
            latestInfo: statisticInfo[ENoticeType.TRIP_APPROVE_NOTICE] ? statisticInfo[ENoticeType.TRIP_APPROVE_NOTICE].latestInfo: null},
        {name: "出差请示", value: ENoticeType.TRIP_APPLY_NOTICE
            , unReadNum: statisticInfo[ENoticeType.TRIP_APPLY_NOTICE] ? statisticInfo[ENoticeType.TRIP_APPLY_NOTICE].unReadNum : 0,
            latestInfo: statisticInfo[ENoticeType.TRIP_APPLY_NOTICE] ? statisticInfo[ENoticeType.TRIP_APPLY_NOTICE].latestInfo: null},
        {name: "精彩活动", value: ENoticeType.ACTIVITY_NOTICE
            , unReadNum: statisticInfo[ENoticeType.ACTIVITY_NOTICE] ? statisticInfo[ENoticeType.ACTIVITY_NOTICE].unReadNum : 0,
            latestInfo: statisticInfo[ENoticeType.ACTIVITY_NOTICE] ? statisticInfo[ENoticeType.ACTIVITY_NOTICE].latestInfo: null}
    ];
    $scope.noticeTypes = noticeTypes;
    $scope.goList = async function(type){
        window.location.href = '#/notice/index?type='+type
    };
}
