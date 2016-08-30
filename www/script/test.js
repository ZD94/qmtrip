'use strict';

var bluebird = require('bluebird');
window.Promise = bluebird.Promise;
var $ = require('jquery');
var jQuery = $;
var _ = require('lodash');
var angular = require('angular');
require('common/client/angular');

angular.module('testApp', ["hmTouchEvents"])
    .controller('TestController', TestController);


function TestController ($scope, $element){
    var div = $element.find('#touch-area');
    var canvas = div.find('canvas')[0];

    var started = false;
    var state = {
        deltaX: 0, deltaY: 0,
        centerX: 0, centerY: 0,
        scale: 1.0,
        rotation: 0,
    }
    $scope.hammerStart = function saveOrigState(event){
        //console.log(event.type, JSON.stringify([event.deltaX, event.deltaY, event.center, event.scale, event.rotation]));
        var rect = canvas.getBoundingClientRect();
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
            var rotation = event.rotation - state.rotation;
            if(rotation < -80 || 80 < rotation)
                return;
            rotateAndScale(state.centerX, state.centerY, rotation, event.scale/state.scale);
            state.rotation = event.rotation;
            state.scale = event.scale;
        }
        repaint();
    }

    var ctx = canvas.getContext('2d');
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var savedMatrix = svg.createSVGMatrix();
    var canvasScale = 1;
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
            .scale(scale, scale)
            .rotate(rotation)
            .translate(-centerX, -centerY)
            .multiply(savedMatrix);
    }
    var img = document.createElement('img');
    function repaint(){
        //ctx.save();
        //ctx.fillStyle = "rgba(128, 128, 128, 0.1)";
        //ctx.fillRect(0, 0, canvas.width, canvas.height);
        //ctx.restore();
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        ctx.transform(savedMatrix.a, savedMatrix.b, savedMatrix.c, savedMatrix.d, savedMatrix.e, savedMatrix.f);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        ctx.restore();
    }

    img.onload = function(){
        if(img.naturalWidth/img.naturalHeight > div.width()/div.height()){
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
    }

    //img.src = 'ionic/images/qrCode.png';
    img.src = 'ionic/images/logo_text.png';
    //img.src = 'ionic/images/backgroud.png';
}