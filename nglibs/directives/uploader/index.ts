"use strict";

import angular = require('angular');
import { wechatUploaderController } from './uploader-wechat';
import { showPreviewDialog } from './preview-dialog';

var use_wxChooseImage = false;

angular
    .module('nglibs')
    .directive('ngUploader', ngUploader);

function ngUploader($loading, wxApi): any {
    require('./uploader.scss');
    var browserspec = require('browserspec');
    if(browserspec.is_wechat){//} && /^(www\.)?jingli365\.com$/.test(window.location.host)){
        if(wxApi.$resolved){
            use_wxChooseImage = true;
        }else{
            console.warn('wxApi not config correctly.')
        }
    }
    return {
        restrict: 'A',
        transclude: true,
        scope:{
            title: '<',
            done: '&',

            name: '<',
            accept: '@',
            url: '<',
        },
        template: function(){
            if(use_wxChooseImage) {
                return undefined;
            }
            return require('./uploader-std.html');
        },
        controller: function($scope, $element, $transclude, $injector, FileUploader, ngModalDlg){
            $element.css('position', 'relative');
            $transclude($scope, function(clone) { $element.append(clone); });
            var uploader = $scope.uploader = new FileUploader({
                url: $scope.url || '/upload/ajax-upload-file?type=image',
                alias: $scope.name || 'tmpFile',
                autoUpload: false
            });
            $scope.previewAndUpload = function(urls) {
                console.info('upload:', urls)
                showPreviewDialog($scope, ngModalDlg, urls, $scope.title)
                    .then(function(blobs) {
                        if(!blobs) {
                            uploader.clearQueue();
                            return;
                        }
                        for(let i=0; i<blobs.length; i++){
                            uploader.queue[i]._file = blobs[i];
                        }
                        $loading.start();
                        uploader.uploadAll();
                    });
            };
            uploader.onAfterAddingAll = async function(files) {
                var urls = files.map((file)=>file._file)
                $scope.previewAndUpload(urls);
            };
            var fileIds = [];
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

            if(use_wxChooseImage) {
                return $injector.invoke(wechatUploaderController, this, {$scope, $element, $transclude});
            }
        }
    };
}