declare var wx: any;

import { showPreviewDialog } from './preview-dialog';

var API = require('common/api');

function wxChooseImage(option){
    return new Promise(function(resolve, reject){
        option.success = resolve;
        option.fail = reject;
        wx.chooseImage(option);
    })
}

function wxUploadImage(option){
    return new Promise(function(resolve, reject){
        option.success = resolve;
        option.fail = reject;
        wx.uploadImage(option);
    })
}

export function wechatUploaderController($scope, $element, $transclude, $ionicModal, $ionicPopup, $loading) {
    $element.append($transclude());
    $element.click(function(){
        wxChooseImage({
            count: 1, // 默认9
            sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        })
            .then(function(res:any){
                var fileLocalId = res.localIds[0]; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
                return showPreviewDialog($scope, $ionicModal, fileLocalId);
            })
            .then(function(fileLocalId){
                $loading.start();
                return wxUploadImage({
                    localId: fileLocalId, // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                });
            })
            .then(function (res: any) {
                var serverId = res.serverId; // 返回图片的服务器端ID
                return API.wechat.mediaId2key({mediaId: serverId});
            })
            .then(function(fileId){
                $scope.done()({code: 0, fileId: fileId});
                $loading.end();
            })
            .catch(function(err){
                console.error(err);
                $loading.end();
                var msg = $ionicPopup.alert({
                    title: '提示',
                    template: '上传出错'
                });
            });
    });
}
