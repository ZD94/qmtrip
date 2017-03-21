import { Notice, ENoticeType } from '_types/notice';
import {ESendType} from "../../../_types/notice/notice";
var msgbox = require('msgbox');

export async function AddNoticeController($scope, Models, $stateParams, $ionicPopup) {
    var notice = Notice.create();

    $scope.notice = notice;
    $scope.types = [{name: "系统通知", value: ENoticeType.SYSTEM_NOTICE},
        {name: "精彩活动", value: ENoticeType.ACTIVITY_NOTICE}];

    $scope.uploadUrl = '/upload/ajax-upload-file?type=avatar';

    $scope.invoicefuc = {title:'上传图片',done:function(response){
        if(response.ret != 0){
            console.error(response.errMsg);
            $ionicPopup.alert({
                title: '错误',
                template: response.errMsg
            });
            return;
        }
        var fileId = response.fileId;
        $scope.notice.picture = fileId[0];
        console.info($scope.notice);
    }}

    $scope.saveNotice = async function(){
        if($scope.notice.toUsers && $scope.notice.toUsers.indexOf('[')>=0 && $scope.notice.toUsers.indexOf(']')>=0){
            notice.sendType = ESendType.MORE_ACCOUNT;
        }else {
            notice.sendType = ESendType.ALL_ACCOUNT;
        }
        if(!$scope.notice.title){
            msgbox.log('标题不能为空');
            return;
        }
        if(!$scope.notice.description){
            msgbox.log('描述不能为空');
            return;
        }
        if(!$scope.notice.content){
            msgbox.log('内容不能为空');
            return;
        }
        await $scope.notice.save();
        window.location.href = '#/group-send-notice/list';
    };
}
