
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
