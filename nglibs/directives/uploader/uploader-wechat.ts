import { showPreviewDialog } from './preview-dialog';

import * as path from 'path';

var API = require('@jingli/dnode-api');

export function wechatUploaderController($scope, $element, $loading, ngModalDlg, wxApi) {
    var config = require('@jingli/config');
    $element.click(async function() {
        try{
            var localIds = await wxApi.chooseImage({
                count: 1, // 默认9
                sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
                sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            });
            //console.log('wxChooseImage:', localIds);

            var serverIds = [];
            for(let id of localIds){
                var serverId = await wxApi.uploadImage({
                    localId: id, // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                });
                serverIds.push(serverId);
            }
            $loading.start();
            var files = await API.wechat.mediaId2key({mediaIds: serverIds});
            await config.$ready;
            let urls = files.map((f)=>{
                return path.join(config.update, 'attachment/temp', f.fileId)+'?expireTime='+f.expireTime+'&sign='+f.sign;
            });
            $scope.uploader.addToQueue(urls);
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
