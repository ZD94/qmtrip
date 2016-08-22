
var dyload = require('dyload');

export function showPreviewDialog($scope, ngModalDlg, files, title): Promise<any>{
    return ngModalDlg.createDialog({
        parent: $scope,
        scope: {files, title},
        template: require('./preview-dialog.html'),
        controller: previewImageController
    });
}

function previewImageController($scope){
    var files = $scope.files;

    for(var file of files){
        previewImage(file)
            .then(function(canvas){
                insertPreviewElement(canvas);
            })
    }

    function insertPreviewElement(element) {
        var $el = $($scope.modal.modalEl);
        $el.find(".preview_img").append(element);
    }
}

async function loadImage(url){
    return new Promise(function(resolve, reject){
        var reader = new FileReader();
        reader.onload = function(event: any){
            var img = new Image();
            img.onload = function() {
                resolve(img);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(url);
    });
}

async function previewImage(url) {
    var [img] = await Promise.all([
        loadImage(url),
        dyload('/script/libs/bundle.img.js')
    ])
    var EXIF = require("exif-js");
    var exifOrient = require("exif-orient");
    return new Promise(function(resolve, reject) {
        EXIF.getData(img, function() {
            var orientation = img['exifdata'].Orientation || 1;
            exifOrient(img, orientation, function(err, canvas) {
                if(err)
                    reject(err);
                else
                    resolve(canvas);
            })
        });
    })
}
