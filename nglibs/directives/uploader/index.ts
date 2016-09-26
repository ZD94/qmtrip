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
            var upload_url = $scope.url || '/upload/ajax-upload-file?type=image';
            var uploader = $scope.uploader = new FileUploader({
                url: upload_url,
                alias: $scope.name || 'tmpFile',
                autoUpload: false
            });
            if(!upload_url.match(/^https?:\/\//)){
                var config = require('config');
                config.$ready.then(()=>{
                    upload_url = config.update + upload_url;
                    $scope.uploader.url = upload_url;
                })
            }
            var fileIds = [];
            uploader.onAfterAddingAll = async function(files) {
                var urls = files.map((file)=>file._file)
                var blobs = await showPreviewDialog($scope, ngModalDlg, urls, $scope.title)
                if(!blobs) {
                    uploader.clearQueue();
                    return;
                }
                //for(let i=0; i<blobs.length; i++){
                //    uploader.queue[i]._file = blobs[i];
                //}
                $loading.start();
                fileIds = [];
                uploader.uploadAll();
            };
            uploader.onSuccessItem  = function (file, response, status, headers) {
                fileIds.push(response.fileId);
                uploader.removeFromQueue(file);
            };
            uploader.onErrorItem  = function (file, response, status, headers) {
                fileIds.push(undefined);
            };
            uploader.onCompleteAll  = function (file, response, status, headers) {
                console.info(fileIds);
                var obj = {
                    ret: 0,
                    errMsg: '',
                    fileId: fileIds
                };
                if(uploader.queue.length > 0){
                    //msgbox.log('文件上传不成功:<br>'+uploader.queue.map((file)=>file.url).join('<br>'));
                    obj.ret = -1;
                    obj.errMsg = '文件上传不成功:<br>'+uploader.queue.map((file)=>file.file.name).join('<br>');
                }
                $scope.done()(obj);
                uploader.clearQueue();
                $loading.end();
            };

            if(use_wxChooseImage) {
                return $injector.invoke(wechatUploaderController, this, {$scope, $element, $transclude});
            }
        }
    };
}
