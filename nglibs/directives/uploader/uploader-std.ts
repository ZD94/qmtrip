
import { showPreviewDialog } from './preview-dialog';

export function stdUploaderController($scope, ngModalDlg, $element, $transclude, $loading, FileUploader) {
    $element.css('position', 'relative');
    $transclude($scope, function(clone) {
        $element.append(clone);
    });
    var fileIds = [];
    var uploader = $scope.uploader = new FileUploader({
        url: $scope.url || '/upload/ajax-upload-file?type=image',
        alias: $scope.name || 'tmpFile',
        autoUpload: false
    });
    uploader.onAfterAddingAll = async function(files) {
        var urls = files.map((file)=>file._file)
        showPreviewDialog($scope, ngModalDlg, urls, $scope.title)
            .then(function(files) {
                if(!files){
                    uploader.clearQueue();
                    return;
                }
                $loading.start();
                uploader.uploadAll();
            });
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
}
