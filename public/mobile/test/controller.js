"use strict";

var test = module.exports = {}

test.IndexController = function($scope){
    loading(true);
}

test.MsgboxController = function($scope){
    loading(true);
    $scope.msgbox = msgbox;
    $scope.alert = function(){
        msgbox.alert('提示对话框');
    }
    $scope.confirm = function(){
        msgbox.confirm('确认对话框')
            .then(function(btn){
                console.log(btn);
            });
    }
    $scope.prompt = function(){
        msgbox.prompt('输入对话框', 12345)
            .then(function(ret){
                console.log(ret[0], ret[1]);
            });
    }
}

test.UploadController = function($scope, FileUploader){
    loading(true);
    $scope.winWidth = $(window).width();
    //$scope.uploader = init_uploader(FileUploader, "/upload/ajax-upload-file?type=invoice");
    $scope.upload_tip = '测试上传';
    $scope.upload_done = function (res) {
        alert('upload_done'+JSON.stringify(res));
        console.log('upload done:', res);
    }
}

test.IconController = function(){
    loading(true);
}