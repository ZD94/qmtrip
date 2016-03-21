var $ = require('jquery');
var EXIF = require("exif-js");
var exifOrient = require("exif-orient");


function init_uploader(FileUploader, url){
    var uploadConf = {
        url: url,
        alias: "tmpFile",
        autoUpload: false
    };
    var uploader = new FileUploader(uploadConf);
    /*
    uploader.filters.push({
        name: 'customFilter',
        fn: function (item, options) {
            return this.queue.length < 10;
        }
    });
    */
    uploader.onAfterAddingFile = function (file) {
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
        $(document).on("click",".reupload",function(){
            $("#upload").remove();
        })
        $(document).on("click",".uploadall",function(){
            uploader.uploadAll();
        })
        var canvas = $("#upload").find('canvas');
        var reader = new FileReader();
        reader.onload = onLoadFile;
        var f = file._file
        reader.readAsDataURL(f);

        function onLoadFile(event) {
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
            var url  = event.target.result;
            img.src = url;
        }
    }
    uploader.onProgress = function(progress){//未完成调试
        var progress = document.getElementById("progress");
        if(!progress){
            progress = document.createElement("div");
            progress.className = 'progress';
            progress.id = 'progress';
            document.body.appendChild(progress);
        }
        var progress_data = [];
        progress_data.push('<div class="">我是进度条</div>');
        progress.innerHTML = progress_data;
    }
    uploader.onCompleteItem = function (fileItem, response, status, headers) {
        fileItem.done(response);
        $("#upload").remove();
    };
    return uploader;
}