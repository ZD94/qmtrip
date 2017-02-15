import * as path from 'path';
import {Staff} from "api/_types/staff/staff";

export async function IndexController($scope, Models, FileUploader) {
    var upload_url = $scope.url || '/upload/ajax-upload-file';
    var uploader = $scope.uploader = new FileUploader({
        url: upload_url,
        alias: $scope.name || 'tmpFile',
        autoUpload: false
    });
    let staff = await Staff.getCurrent();
    $scope.company = staff.company;
    if(!upload_url.match(/^https?:\/\//)){
        var config = require('config');
        config.$ready.then(()=>{
            upload_url = path.normalize(path.join(config.update, upload_url));
            $scope.uploader.url = upload_url;
        })
    }
    var fileIds = [];
    var tempFiles = {};
    let hasFile = false;

    uploader.onAfterAddingAll = async function(files) {

        //$loading.start();
        console.info(files[0]._file.name);
        $scope.fileName = files[0]._file.name;
        hasFile = true;
        // uploader.uploadAll();
    };

    uploader.onProgressItem = function(file, progress){
        $scope.progress = progress;
    }

    uploader.onSuccessItem  = function (file, response, status, headers) {
        fileIds.push(response.fileId);
        tempFiles[response.fileId] = response;
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
            fileId: fileIds,
            tempFiles:tempFiles
        };
        if(uploader.queue.length > 0){
            //msgbox.log('文件上传不成功:<br>'+uploader.queue.map((file)=>file.url).join('<br>'));
            obj.ret = -1;
            obj.errMsg = '文件上传不成功:<br>'+uploader.queue.map((file)=>file.file.name).join('<br>');
        }
        $scope.done(obj);
        uploader.clearQueue();
        //$loading.end();
    };

    $scope.done = function(obj){
        //这里是上传成功之后的回调，在这里接口调用把fileId传给服务器
        console.info(obj);
    }
    $scope.upload = function(){
        if(!hasFile){
            alert('请先选择文件');
            return;
        }
        uploader.uploadAll();
        console.info('success');
    }
}