
var dyload = require('dyload');

export function showPreviewDialog($scope, ngModalDlg, files, title): Promise<any>{
    return ngModalDlg.createDialog({
        parent: $scope,
        scope: {files, title},
        template: require('./preview-dialog.html'),
        controller: previewImageController
    });
}

async function previewImageController($scope, $element){
    var files = $scope.files;

    $scope.canvases = await Promise.all(files.map(loadImageAsCanvas));

    var $el = $element.find(".preview_img");
    for(let canvas of $scope.canvases){
        $el.append(canvas);
    }

    $scope.confirm = function(){
        var results = Promise.all($scope.canvases.map(function(canvas){
            return new Promise(function(resolve){
                require('blueimp-canvas-to-blob');
                canvas.toBlob(resolve);
            });
        }));
        $scope.confirmModal(results);
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
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(url);
    });
}

async function loadImageAsCanvas(url) {
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
