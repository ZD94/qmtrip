declare var wx: any;

import { showPreviewDialog } from './preview-dialog';

var API = require('common/api');
var isFinishInitWx = false;

function hanleError(err) {
    alert(err.msg || err);
}

export function ngUploaderWechat($loading) {
    console.log('ngUploaderWechat called');
    return {
        restrict: 'A',
        scope: {
            title: '<',
            done: '&'
        },
        controller: function($scope, $element, $ionicModal) {
            API.require('wechat');
            API.onload(function(){
                if (!isFinishInitWx) {
                    isFinishInitWx = true;
                    var url = window.location.href.split('#')[0];
                    API.wechat.getJSDKParams({url:url, jsApiList:['chooseImage', 'uploadImage'], debug:false})
                        .then(function(cfg) {
                            //alert(JSON.stringify(cfg))
                            wx.config(cfg);
                        })
                        .catch(function(err) {
                            isFinishInitWx = false;
                            hanleError(err);
                        });
                }
                wx.error(hanleError)
                wx.ready(function(){
                    $element.bind('click', function(e){
                        e.preventDefault();
                        $scope.onClickUpload();
                    });
                });
            });
            $scope.onClickUpload = function(){
                wx.chooseImage({
                    count: 1, // 默认9
                    sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
                    sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
                    success: function (res) {
                        var fileLocalId = res.localIds[0]; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
                        showPreviewDialog($scope, $ionicModal, fileLocalId, function() {
                            $loading.start();
                            wx.uploadImage({
                                localId: fileLocalId, // 需要上传的图片的本地ID，由chooseImage接口获得
                                isShowProgressTips: 1, // 默认为1，显示进度提示
                                success: function (res) {
                                    var serverId = res.serverId; // 返回图片的服务器端ID
                                    API.wechat.mediaId2key({mediaId: serverId})
                                        .then(function(fileId){
                                            $scope.done()({code: 0, fileId: fileId});
                                            $loading.end();
                                        })
                                        .catch(hanleError)
                                }
                            });
                        });
                    },
                    fail: hanleError
                });
            }
        }
    };
}
