import * as path from 'path';
import {Staff} from "api/_types/staff/staff";

export async function IndexController($scope, Models, FileUploader) {
    $scope.title = '批量添加员工';
    $scope.step = 'three';
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

    $scope.done = async function(obj){
        //这里是上传成功之后的回调，在这里接口调用把fileId传给服务器
        console.info(obj);
        console.info(obj.fileId[0]);
        API.require("staff");
        await API.onload();
        try{
            let allData = await API.staff.batchImportStaff({fileId: obj.fileId[0]});
            console.info(allData);
            console.info("=======================----------------------------");
            $scope.noAddObj = JSON.parse(allData.noAddObj);
            $scope.addObj = JSON.parse(allData.addObj);
            $scope.addObjNum = JSON.parse(allData.addObj).length;
            $scope.noAddObjNum = JSON.parse(allData.noAddObj).length;
            // $scope.downloadInvalidData = allData.downloadNoAddObj;
            // $scope.downloadValidData = allData.downloadAddObj;
            console.info($scope.addObj);
            console.info($scope.noAddObj);
        }catch(err){
            console.info(err.msg);
        }
    }
    $scope.percent = 0;
    let percentNum = 0;
    let time = setInterval(function(){
        if(percentNum > 99){
            clearInterval(time);
            $scope.step = 'three';
            $scope.title = '处理结果';
            $scope.$apply();
            return;
        }else{
            percentNum++;
            $scope.percent = percentNum;
            $scope.$apply();
        }
    },100)
    $scope.upload = function(){
        if(!hasFile){
            alert('请先选择文件');
            return;
        }
        uploader.uploadAll();
        console.info('success');
    }
}