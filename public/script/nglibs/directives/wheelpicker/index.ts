"use strict";

import angular = require('angular');

export = function($module) {
    //angular.module('tld.common', ['ngTouch'])
    $module
        .directive('tldWheelPicker', tldWheelPicker)
        .directive('tldMultiWheelPicker', tldMultiWheelPicker);
}

function tldMultiWheelPicker(){
    require('./style.less');
    return {
        restrict: 'EA',
        replace: true,
        template: require('./wheelpicker.multi.tpl.html'),
        scope: {
            ngModel: '=',
            wheelOptions: '=tldWheelOptions',
            lineHeight: '@tldWheelLineHeight',
            wheelLabel: '@tldWheelLabel'
        }
    };
}

function tldWheelPicker() {
    require('./style.less');
    return {
        restrict : 'EA',
        replace: true,
        transclude: true,
        template: require('./wheelpicker.tpl.html'),
        scope: {
            ngModel: '=',
            wheelOptions: '=tldWheelOptions',
            lineHeight: '@tldWheelLineHeight',
            wheelLabel: '@tldWheelLabel'
        },
        controller: function($scope, $element){
            let initY = ($element.height()-$scope.lineHeight)/2;
            $scope.selectedY = initY;

            $scope.calculateY = (i:number) => {
                let current = $scope.wheelOptions.indexOf($scope.ngModel);
                if(current < 0)
                    current = 0;
                let itemY = (i-current)*$scope.lineHeight;
                return {'-webkit-transform': 'translateY(' + ($scope.selectedY+itemY) + 'px)'};
            };
            function updateTranslateY(newvals, oldvals, scope){
                scope.translateY = scope.wheelOptions.map((v, i) => {
                    return scope.calculateY(i);
                })
            }
            updateTranslateY(0, 0, $scope);
            $scope.$watchGroup(['ngModel', 'selectedY'], updateTranslateY);
            function updateOptionTexts(){
                $scope.wheelLabels = $scope.wheelOptions.map((v, i) => {
                    return $scope.$eval($scope.wheelLabel, {$index: i, $value: v}) ;
                })
            }
            updateOptionTexts();
            $scope.$watch('wheelOptions', (n, o, scope) => {
                updateTranslateY(n, o, scope);
                updateOptionTexts();
            });

            function updateOffsetY(offsetY){
                $scope.selectedY = initY+offsetY;

                let offset = Math.round(offsetY/$scope.lineHeight);
                if(offset == 0)
                    return;
                let current = $scope.wheelOptions.indexOf($scope.ngModel);
                let index = current-offset;
                if(index < 0 || $scope.wheelOptions.length <= index)
                    return;
                $scope.ngModel = $scope.wheelOptions[index];
                let moveY = (index-current)*$scope.lineHeight;
                $scope.selectedY = $scope.selectedY + moveY;
                startY = startY - moveY;
            }
            function getCoordinates(event) {
                var originalEvent = event.originalEvent || event;
                var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
                var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

                return {
                    x: e.clientX,
                    y: e.clientY
                };
            }
            let startY = NaN;
            function start(e) {
                e.preventDefault();
                var coords = getCoordinates(e);
                startY = coords.y;
            }
            function move(e){
                e.preventDefault();
                if(Number.isNaN(startY))
                    return;
                var coords = getCoordinates(e);
                updateOffsetY(coords.y - startY);
                $scope.$apply();
            }
            function end(e){
                e.preventDefault();
                if(Number.isNaN(startY))
                    return;
                var coords = getCoordinates(e);
                updateOffsetY(coords.y - startY);
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
            $element.on('mouseupleave touchcancel', cancel);
        }
    }
}
