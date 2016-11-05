import { showPreviewDialog } from './preview-dialog';

var API = require('common/api');

export function wechatUploaderController($scope, $element, $loading, ngModalDlg, wxApi) {
    $element.click(async function() {
        var files = await wxApi.chooseImage({
            count: 1, // 默认9
            sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        });
        console.log('wxChooseImage:', files);

        var blobs = await showPreviewDialog($scope, ngModalDlg, files, $scope.title);

        if(!blobs)
            return;
        try{
            /*
            var p = files.map(async function(f){
                var res:any = await wxUploadImage({
                    localId: f, // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                });
                return res.serverId;
            })
            var serverIds = await Promise.all(p);
            */
            var serverIds = [];
            for(let f of files){
                var serverId = await wxApi.uploadImage({
                    localId: f, // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                });

                serverIds.push(serverId);
            }
            $loading.start();
            var fileIds = await API.wechat.mediaId2key({mediaIds: serverIds});

            $scope.done()({ret: 0, errMsg:'', fileId: fileIds});
        } catch(e){
            console.log(e.stack);
            $scope.done()({
                code: -1,
                errMsg: '文件上传失败'
            });
        } finally {
            $loading.end();
        }
    });
}
