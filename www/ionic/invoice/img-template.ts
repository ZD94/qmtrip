/**
 * Created by seven on 2016/11/3.
 */
"use strict";

export async function ImgTemplateController($scope, $element){
    console.info($scope.imgUrl);
    require('./img-template.scss');
    console.info($element);
    let loadimg = loadImage($scope.imgUrl);
    var $el = $element.find('#previewImg');
    loadimg
        .then(function(img: HTMLImageElement){
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var width = img.naturalWidth;
            var height = img.naturalHeight;
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            $el.append(canvas);
        })
    function loadImage(url): Promise<HTMLImageElement>{
        return new Promise<HTMLImageElement>(function(resolve, reject){
            let img = new Image();
            img.onload = function(e){
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        })
    }
}