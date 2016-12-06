
import angular = require('angular');
var dyload = require('dyload');

angular
    .module('nglibs')
    .directive('picView', picView)
    .directive('picEditor', picEditor);


function picView($loading, wxApi): any {
    return {
        template: require('./pic-view.html'),
        scope: {
            imageSrc: '=',
        },
        controller: picViewController,
    }
}

async function picViewController($scope, $element) {
    let canvas = $element.find('canvas')[0];
    let img = await loadFileImage($scope.imageSrc);

    var orient = 1;
    if(!isWeixinFile(img.src)) {
        orient = await getOrient(img);
    }
    if(orient != 1) {
        await dyload('script/libs/bundle.img.js');
        let exifOrient = require("exif-orient");
        let exifOrientAsync = Promise.promisify<HTMLCanvasElement, HTMLImageElement, number>(exifOrient);
        let loaded = await exifOrientAsync(img, orient);
        canvas.width = loaded.width;
        canvas.height = loaded.height;
        let data = loaded.getContext('2d').getImageData(0, 0, loaded.width, loaded.height);
        canvas.getContext('2d').putImageData(data, 0, 0);
        return;
    }

    var ctx = canvas.getContext('2d');
    var width = img.naturalWidth;
    var height = img.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
}

function picEditor($loading, wxApi): any {
    return {
        template: require('./pic-editor.html'),
        scope: {
            imageSrc: '=',
            canvasWidth: '<',
            canvasHeight: '<',
        },
        controller: picEditorController,
    }
}

async function picEditorController($scope, $element){
    let div = $element.find('.touch-area');
    let canvas = div.find('canvas')[0];

    let started = false;
    let state = {
        deltaX: 0, deltaY: 0,
        centerX: 0, centerY: 0,
        scale: 1.0,
        rotation: 0,
    }

    let img: HTMLImageElement;
    let ctx = canvas.getContext('2d');
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    let savedMatrix = svg.createSVGMatrix();
    let canvasScale = 1;
    function translate(x, y){
        //console.log('translate '+JSON.stringify(Array.prototype.slice.call(arguments)));
        savedMatrix = svg.createSVGMatrix()
            .translate(x * canvasScale, y * canvasScale)
            .multiply(savedMatrix);
    }
    function rotateAndScale(centerX, centerY, rotation, scale){
        //console.log('transform '+JSON.stringify(Array.prototype.slice.call(arguments)));
        centerX *= canvasScale;
        centerY *= canvasScale;
        savedMatrix = svg.createSVGMatrix()
            .translate(centerX, centerY)
            .scale(scale)
            .rotate(rotation)
            .translate(-centerX, -centerY)
            .multiply(savedMatrix);
    }
    function repaint(){
        //ctx.save();
        //ctx.fillStyle = "rgba(128, 128, 128, 0.1)";
        //ctx.fillRect(0, 0, canvas.width, canvas.height);
        //ctx.restore();
        ctx.clearRect(0,0,canvas.width,canvas.height);
        if(!img)
            return;
        ctx.save();
        ctx.transform(savedMatrix.a, savedMatrix.b, savedMatrix.c, savedMatrix.d, savedMatrix.e, savedMatrix.f);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        ctx.restore();
        if($scope.canvasWidth && $scope.canvasHeight){
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, div.width(), (div.height()-$scope.canvasHeight)/2);
            ctx.fillRect(0, (div.height()-$scope.canvasHeight)/2, (div.width()-$scope.canvasWidth)/2, $scope.canvasHeight);
            ctx.fillRect($scope.canvasWidth+(div.width()-$scope.canvasWidth)/2, (div.height()-$scope.canvasHeight)/2, (div.width()-$scope.canvasWidth)/2, $scope.canvasHeight);
            ctx.fillRect(0, $scope.canvasHeight+(div.height()-$scope.canvasHeight)/2, div.width(), (div.height()-$scope.canvasHeight)/2);
        }
    }

    img = await loadFileImage($scope.imageSrc);
    if($scope.canvasWidth && $scope.canvasHeight){
        canvas.width = div.width();
        canvas.height = div.height();
        canvasScale = 1;
        translate((canvas.width - img.naturalWidth)/2/canvasScale, (canvas.height - img.naturalHeight)/2/canvasScale);
    } else if(img.naturalWidth/img.naturalHeight > div.width()/div.height()){
        canvas.width = img.naturalWidth;
        canvasScale = img.naturalWidth / div.width();
        canvas.height = div.height()*canvasScale;
        translate(0, (canvas.height - img.naturalHeight)/2/canvasScale);
    } else {
        canvas.height = img.naturalHeight;
        canvasScale = img.naturalHeight / div.height();
        canvas.width = div.width()*canvasScale;
        translate((canvas.width - img.naturalWidth)/2/canvasScale, 0);
    }
    repaint();

    $scope.hammerStart = function saveOrigState(event){
        //console.log(event.type, JSON.stringify([event.deltaX, event.deltaY, event.center, event.scale, event.rotation]));
        let rect = canvas.getBoundingClientRect();
        state.deltaX = event.deltaX;
        state.deltaY = event.deltaY;
        state.centerX = event.center.x - rect.left;
        state.centerY = event.center.y - rect.top;
        state.scale = 1.0;
        state.rotation = event.rotation;
        started = true;
    }
    $scope.hammerEnd = function onHammerEnd(event){
        //console.log(event.type, JSON.stringify([event.deltaX, event.deltaY, event.center, event.scale, event.rotation]));
        started = false;
    }
    $scope.onHammer = function onHammer(event) {
        $scope.types = event.scale;
        //console.log(event.type, JSON.stringify([event.deltaX, event.deltaY, event.center, event.scale, event.rotation]));
        if(!started){
            return;
        }
        if(event.type == 'pan'){
            translate(event.deltaX - state.deltaX, event.deltaY - state.deltaY);
            state.deltaX = event.deltaX;
            state.deltaY = event.deltaY;
        }
        else if(event.type == 'pinch' || event.type == 'rotate'){
            let rotation = event.rotation - state.rotation;
            if(rotation < -80 || 80 < rotation)
                return;
            rotateAndScale(state.centerX, state.centerY, rotation, event.scale/state.scale);
            state.rotation = event.rotation;
            state.scale = event.scale;
        }
        repaint();
    }

    $(canvas).data('toBlob', function(){
        require('blueimp-canvas-to-blob');
        return new Promise(function(resolve) {
            if($scope.canvasWidth && $scope.canvasHeight){
                let data = ctx.getImageData((canvas.width - $scope.canvasWidth)/2, (canvas.height - $scope.canvasHeight)/2, $scope.canvasWidth, $scope.canvasHeight);
                let tmp = document.createElement('canvas') as HTMLCanvasElement;
                tmp.width = $scope.canvasWidth;
                tmp.height = $scope.canvasHeight;
                let tmpctx = tmp.getContext('2d');
                tmpctx.putImageData(data, 0, 0);
                tmp.toBlob(function(blob){
                    resolve(blob);
                })
            }else{
                canvas.toBlob(function(blob){
                    resolve(blob);
                });
            }
        });
    });
}


function loadFile(file): Promise<string>{
    return new Promise<string>(function(resolve, reject){
        let reader = new FileReader();
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
    if(typeof url !== 'string'){
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

function isWeixinFile(url){
    var o = new URL(url, location.href);
    var protocol = o.protocol.toLocaleLowerCase();
    return protocol === 'wxlocalresource:' || protocol === 'weixin:';
}
