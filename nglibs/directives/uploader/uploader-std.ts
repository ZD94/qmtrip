
import { showPreviewDialog } from './preview-dialog';

export function stdUploaderController($scope, $ionicModal, $element, $transclude, $loading, FileUploader) {
    $element.css('position', 'relative');
    $element.append($transclude());
    var fileIds = [];
    var uploader = new FileUploader({
        url: $scope.url || '/upload/ajax-upload-file?type=image',
        alias: $scope.name || 'tmpFile',
        autoUpload: false
    });
    uploader.onAfterAddingAll = async function(files) {
        //modal不能再showPreviewDialog中创建否则将会创建多个modal（modal.hide()将不起作用）
        var template = require('./preview-dialog.html');
        $scope.modal = $ionicModal.fromTemplate(template, {
            scope: $scope,
            animation: 'slide-in-up',
            focusFirstInput: true
        });
        //此处应该清除uploader队列否则之前取消的图片会被传上去
        var sparefiles = uploader.queue.length-files.length;
        if(sparefiles > 0){
            /*for(var i = 0;i<sparefiles;i++){
                uploader.removeFromQueue(i);
            }*/
            uploader.queue = uploader.queue.slice(sparefiles);//截取数组(待测试)
        }

        if(Array.isArray(files)){
            await Promise.all(files.map(async function(file){
                await showPreviewDialog($scope, $ionicModal, file._file)
                    .then(function() {
                        $loading.start();
                        uploader.uploadAll();
                    });
            }))
        }else{
            showPreviewDialog($scope, $ionicModal, files._file)
                .then(function() {
                    $loading.start();
                    uploader.uploadAll();
                });
        }
    };

    uploader.onCompleteItem  = function (file, response, status, headers) {
        fileIds.push(response.fileId);
        // $scope.done()(response);
        // $loading.end();
    };

    uploader.onCompleteAll  = function (file, response, status, headers) {
        console.info(fileIds);
        var obj = {ret: 0, errMsg: "", fileId: fileIds}
        $scope.done()(obj);
        $loading.end();
    };


    $scope.uploader = uploader;
}
