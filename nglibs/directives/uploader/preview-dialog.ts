
var dyload = require('dyload');

function isWeixinFile(url){
    var o = new URL(url);
    var protocol = o.protocol.toLocaleLowerCase();
    return protocol === 'wxlocalresource:' || protocol === 'weixin:';
}

export function showPreviewDialog($scope, ngModalDlg, files, title): Promise<any>{
    return ngModalDlg.createDialog({
        parent: $scope,
        scope: {files, title},
        template: require('./preview-dialog.html'),
        controller: previewImageController
    });
}

async function previewImageController($scope, $element){
    dyload('script/libs/bundle.img.js')
    var files = $scope.files;

    var $el = $element.find(".preview_img");
    var test = false;
    if(test){
        for(let file of files){
            //let imgs = $('<img src="' + file + '"/>');
            //$el.append(imgs);
            //let img = imgs[0] as HTMLImageElement;
            let loadimg = loadImage(file);
            loadimg
                .then(function(img: HTMLImageElement){

                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    var width = img.naturalWidth;
                    var height = img.naturalHeight;
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    $scope.canvases = [canvas];
                    $el.append(canvas);
                })
        }
    }else{
        $scope.canvases = await Promise.all(files.map(loadImageAsCanvas));
        for(let canvas of $scope.canvases){
            $el.append(canvas);
        }
    }

    $scope.confirm = function(){
        var results = Promise.all($scope.canvases
            .map(function(canvas) {
                return new Promise(function(resolve) {
                    //require('blueimp-canvas-to-blob');
                    //canvas.toBlob(function(blob){
                    //    resolve(blob);
                    //});
                    resolve($scope.files);
                });
            }))
            .catch(function(e) {
                console.log(e.stack);
            });
        $scope.confirmModal(results);
    }
}

function loadFile(file): Promise<string>{
    return new Promise<string>(function(resolve, reject){
        var reader = new FileReader();
        reader.onload = function(event: any){
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    })
}
function loadImage(url): Promise<HTMLImageElement>{
    return new Promise<HTMLImageElement>(function(resolve, reject){
        let img = new Image();
        img.onload = function(e){
            resolve(img);
        };
        img.onerror = reject;
        //img.crossOrigin = 'anonymous';
        img.src = url;
    })
}

async function loadFileImage(url){
    if(typeof url !== 'string' || !isWeixinFile(url)){
        url = await loadFile(url);
    }
    return loadImage(url);
}

async function getOrient(img): Promise<number>{
    await dyload('script/libs/bundle.img.js');
    var EXIF = require("exif-js");
    return new Promise<number>(function(resolve, reject) {
        EXIF.getData(img, function() {
            var orientation = img['exifdata'].Orientation || 1;
            resolve(orientation);
        });
    });
}

async function image2Canvas(img): Promise<HTMLCanvasElement>{
    var orient = 1;
    if(!isWeixinFile(img.src)) {
        orient = await getOrient(img);
    }
    if(orient != 1) {
        await dyload('script/libs/bundle.img.js');
        let exifOrient = require("exif-orient");
        let exifOrientAsync = Promise.promisify<HTMLCanvasElement, HTMLImageElement, number>(exifOrient);
        return exifOrientAsync(img, orient);
    }

    var canvas = document.createElement('canvas') as HTMLCanvasElement;
    var ctx = canvas.getContext('2d');
    var width = img.naturalWidth;
    var height = img.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
}

async function loadImageAsCanvas(url) {
    let img = await loadFileImage(url);

    return image2Canvas(img);
}
