
import { showPreviewDialog } from './preview-dialog';
export function ngUploaderStd($loading){
    return {
        restrict: 'A',
        transclude: true,
        template: require('./uploader-std.html'),
        scope:{
            accept: '@',
            title: '<',
            url: '<',
            name: '<',
            done: '&'
        },
        controller: function($scope, $ionicModal, $element, $transclude, FileUploader) {
            $element.css('position', 'relative');
            $element.append($transclude());
            var uploader = new FileUploader({
                url: $scope.url || '/upload/ajax-upload-file?type=image',
                alias: $scope.name || 'tmpFile',
                autoUpload: false
            });
            uploader.onAfterAddingFile = function(file) {
                showPreviewDialog($scope, $ionicModal, file._file, function() {
                    $loading.start();
                    uploader.uploadAll();
                });
            };

            uploader.onCompleteItem = function (file, response, status, headers) {
                $scope.done()(response);
                $loading.end();
            };
            $scope.uploader = uploader;
        }
    };
}
