var $ = require('jquery');
var EXIF = require("exif-js");
var exifOrient = require("exif-orient");

var use_wxChooseImage = false;

function hanleError(err) {
    alert(err.msg || err);
}

function init_directive($module){
    "use strict";
    if(browserspec.is_wechat && /^(www\.)?qmtrip\.com\.cn$/.test(window.location.host)){
        use_wxChooseImage = true;
    }

    if(!use_wxChooseImage){
        $module
            .directive('ngUploader', function (FileUploader) {
                return {
                    restrict: 'A',
                    template: '<input nv-file-select uploader="uploader" type="file">',
                    replace: true,
                    controller: function($scope) {
                        var cnf = {
                            url: "/upload/ajax-upload-file?type=image",
                            alias: "tmpFile",
                            autoUpload: false
                        }

                        var uploader = new FileUploader(cnf);
                        uploader.onAfterAddingFile = function(file) {
                            onAfterAddingFile(file, function() {
                                uploader.uploadAll();
                            });
                        };

                        uploader.onCompleteItem = function (fileItem, response, status, headers) {
                            fileItem.done(response);
                            loading(true);
                            $("#upload").remove();
                        };
                        $scope.uploader = uploader;
                    },
                    compile: function(element, attributes) {
                        element.prepend(element.attr('lable'));
                        var input = element.find('input');
                        input.attr('accept', element.attr('accept'));
                        input.attr('options', element.attr('options'));
                    }
                };
            });
    }else{
        $module
            .directive('ngUploader', function () {
                return {
                    restrict: 'A',
                    link: function(scope, element, attributes){
                        API.require('wechat');
                        API.onload(function(){
                            API.wechat.getJSDKParams({url:window.location.href, jsApiList:['chooseImage', 'uploadImage'], debug:true})
                                .then(function(cfg) {
                                    wx.config(cfg);
                                })
                                .catch(hanleError);
                            wx.ready(function(){
                                bindUpload();
                            });
                        });

                        function bindUpload() {
                            var options = scope.$eval(attributes.options);
                            element.prepend(element.attr('lable'));
                            element.bind('click', function(e){
                                wx.chooseImage({
                                    count: 1, // 默认9
                                    sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
                                    sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
                                    success: function (res) {
                                        options._file = res.localIds[0]; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
                                        onAfterAddingFile(options, function() {
                                            alert("准备上传文件");
                                            wx.uploadImage({
                                                localId: options._file, // 需要上传的图片的本地ID，由chooseImage接口获得
                                                isShowProgressTips: 1, // 默认为1，显示进度提示
                                                success: function (res) {
                                                    var serverId = res.serverId; // 返回图片的服务器端ID
                                                    API.wechat.mediaId2key({mediaId: serverId})
                                                        .then(function(fileId){
                                                            alert({code: 0, fileId: fileId})
                                                            options.done({code: 0, fileId: fileId});
                                                            loading(true);
                                                        })
                                                        .catch(hanleError)
                                                }
                                            });
                                        });
                                    },
                                    fail: hanleError
                                });
                            });
                        }

                    }
                };
            });
    }

    function onAfterAddingFile(file, uploadedCbFn){
        var data = [];
        data.push('<div class="upload_sure">');
        data.push('<div class="img_tit"><span class="web-icon-font3">'+file.title+'</span></div>');
        data.push('<div class="preview_img"></div>');
        data.push('<div class="img_button"><div class="reupload">取消</div><div class="uploadall">确定</div></div>');
        data.push('</div>');
        data = data.join('');
        var fileupload = document.getElementById('upload');
        if(!fileupload){
            fileupload = document.createElement("div");
            fileupload.className = 'upload_images';
            fileupload.id = 'upload';
            document.body.appendChild(fileupload);
        }
        fileupload.innerHTML = data;

        $(".reupload").bind("click", cancel);
        $(".uploadall").bind('click', function() {
            uploadedCbFn(file);
        });
        function cancel() {
            $("#upload").remove();
        }

        var canvas = $("#upload").find('canvas');
        if (use_wxChooseImage) {
            previewImage(file._file);
        } else {
            var reader = new FileReader();
            reader.onload = onLoadFile;
            var f = file._file
            reader.readAsDataURL(f);
        }

        function onLoadFile(event) {
            previewImage(event.target.result);
        }

        function previewImage(url) {
            if (use_wxChooseImage) {
                $(".preview_img").append("<img src='"+url+"'/>");
                return;
            }

            var img = new Image();
            img.onload = function() {
                EXIF.getData(img, function() {
                    var orientation = img.exifdata.Orientation || 1;
                    exifOrient(img, orientation, function(err, canvas) {
                        if (err) {
                            return alert(err);
                        }
                        $(".preview_img").append(canvas);
                    })
                });
            }
            img.src = url;
        }
    }
}