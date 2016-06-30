"use strict";

import angular = require('angular');

angular
    .module('nglibs')
    .directive('tldWheelPicker', tldWheelPicker)
    .directive('tldMultiWheelPicker', tldMultiWheelPicker);

import './citypicker';

function tldMultiWheelPicker(){
    require('./style.scss');
    return {
        restrict: 'EA',
        replace: true,
        template: require('./wheelpicker.multi.tpl.html'),
        scope: {
            ngModelArray: '=',
            wheelOptionsFunc: '<tldWheelOptionsFunc',
            lineHeight: '@tldWheelLineHeight',
            wheelLabel: '&tldWheelLabel'
        }
    };
}

function tldWheelPicker() {
    require('./style.scss');
    return {
        restrict : 'EA',
        replace: true,
        transclude: true,
        template: require('./wheelpicker.tpl.html'),
        scope: {
            wheelSelected: '=ngModel',
            wheelOptions: '=tldWheelOptions',
            lineHeight: '@tldWheelLineHeight',
            wheelLabel: '&tldWheelLabel'
        },
        controller: function($scope, $element){
            let lineHeight = $scope.lineHeight;
            if(!lineHeight || lineHeight=='')
                lineHeight = 20;
            let initY = ($element.height()-lineHeight)/2;
            $scope.selectedY = initY;

            $scope.calculateY = (i:number) => {
                let current = $scope.wheelOptions.indexOf($scope.wheelSelected);
                if(current < 0)
                    current = 0;
                let itemY = (i-current)*lineHeight;
                return {'-webkit-transform': 'translateY(' + ($scope.selectedY+itemY) + 'px)'};
            };
            function updateTranslateY(n?, o?, scope?){
                $scope.translateY = $scope.wheelOptions.map((v, i) => {
                    return $scope.calculateY(i);
                });
            }
            function updateOptionTexts(){
                $scope.wheelLabels = $scope.wheelOptions.map((v, i) => {
                    return $scope.wheelLabel({$index: i, $value: v}) ;
                })
                let current = $scope.wheelOptions.indexOf($scope.wheelSelected);
                if(current < 0)
                    $scope.wheelSelected = $scope.wheelOptions[0];
            }
            updateOptionTexts();
            updateTranslateY();
            $scope.$watchGroup(['wheelSelected', 'selectedY'], updateTranslateY);
            $scope.$watch('wheelOptions', (n, o, scope) => {
                updateOptionTexts();
                updateTranslateY();
            });


            function getEventY(event) {
                var originalEvent = event.originalEvent || event;
                var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
                var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];
                return e.clientY;
            }
            let startY = NaN;
            function updateOffsetY(offsetY){
                if($scope.wheelOptions.length == 0)
                    return;
                $scope.selectedY = initY+offsetY;

                let offset = Math.round(offsetY/lineHeight);
                if(offset == 0)
                    return;
                let current = $scope.wheelOptions.indexOf($scope.wheelSelected);
                let index = current-offset;
                if(index < 0 || $scope.wheelOptions.length <= index)
                    return;
                $scope.wheelSelected = $scope.wheelOptions[index];
                let moveY = (index-current)*lineHeight;
                $scope.selectedY = $scope.selectedY + moveY;
                startY = startY - moveY;
            }
            function start(e) {
                e.preventDefault();
                startY = getEventY(e);
            }
            function move(e){
                e.preventDefault();
                if(Number.isNaN(startY))
                    return;
                updateOffsetY(getEventY(e) - startY);
                $scope.$apply();
            }
            function end(e){
                e.preventDefault();
                if(Number.isNaN(startY))
                    return;
                updateOffsetY(getEventY(e) - startY);
                $scope.selectedY = initY;
                startY = NaN;
                $scope.$apply();
            }
            function cancel(e){
                e.preventDefault();
                if(Number.isNaN(startY))
                    return;
                $scope.selectedY = initY;
                startY = NaN;
                $scope.$apply();
            }
            $element.on('mousedown touchstart', start);
            $element.on('mousemove touchmove', move);
            $element.on('mouseup touchend', end);
            $element.on('mouseleave touchcancel', cancel);
        }
    }
}
