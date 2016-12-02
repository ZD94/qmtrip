import { NoticeAccount } from 'api/_types/notice/noticeAccount';
import { Staff } from 'api/_types/staff/staff';
import {ENoticeType, ESendType} from "../../../api/_types/notice/notice";

export async function ListController($scope, Models, $stateParams) {
    $scope.getList = async function (senfType){
        var where: any = {sendType: {$or: [ESendType.MORE_ACCOUNT, ESendType.ALL_ACCOUNT]}};
        if(senfType == "already_send"){
            where.isSend = true;
        }
        if(senfType == "no_send"){
            where.isSend = false;
        }
        var notices = await Models.notice.find({where: where});

        $scope.notices = notices;
    }
    await $scope.getList("all")

}
