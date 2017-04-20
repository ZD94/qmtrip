"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
angular
    .module('nglibs')
    .directive('ngWheelPicker', ngWheelPicker)
    .directive('ngMultiWheelPicker', ngMultiWheelPicker);
require("./citypicker");
function ngMultiWheelPicker() {
    require('./wheelpicker.scss');
    return {
        restrict: 'EA',
        replace: true,
        template: require('./wheelpicker.multi.tpl.html'),
        scope: {
            ngModelArray: '=',
            wheelOptionsFunc: '<ngWheelOptionsFunc',
            lineHeight: '@ngWheelLineHeight',
            wheelLabel: '&ngWheelLabel'
        }
    };
}
function ngWheelPicker() {
    require('./wheelpicker.scss');
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        template: require('./wheelpicker.tpl.html'),
        scope: {
            wheelSelected: '=ngModel',
            wheelOptions: '=ngWheelOptions',
            lineHeight: '@ngWheelLineHeight',
            wheelLabel: '&ngWheelLabel'
        },
        controller: function ($scope, $element) {
            var lineHeight = $scope.lineHeight;
            if (!lineHeight || lineHeight == '')
                lineHeight = 20;
            var initY = ($element.height() - lineHeight) / 2;
            $scope.selectedY = initY;
            $scope.calculateY = function (i) {
                var current = $scope.wheelOptions.indexOf($scope.wheelSelected);
                if (current < 0)
                    current = 0;
                var itemY = (i - current) * lineHeight;
                return { '-webkit-transform': 'translateY(' + ($scope.selectedY + itemY) + 'px)' };
            };
            function updateTranslateY(n, o, scope) {
                $scope.translateY = $scope.wheelOptions.map(function (v, i) {
                    return $scope.calculateY(i);
                });
            }
            function updateOptionTexts() {
                $scope.wheelLabels = $scope.wheelOptions.map(function (v, i) {
                    return $scope.wheelLabel({ $index: i, $value: v });
                });
                var current = $scope.wheelOptions.indexOf($scope.wheelSelected);
                if (current < 0)
                    $scope.wheelSelected = $scope.wheelOptions[0];
            }
            updateOptionTexts();
            updateTranslateY();
            $scope.$watchGroup(['wheelSelected', 'selectedY'], updateTranslateY);
            $scope.$watch('wheelOptions', function (n, o, scope) {
                updateOptionTexts();
                updateTranslateY();
            });
            function getEventY(event) {
                var originalEvent = event.originalEvent || event;
                var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
                var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];
                return e.clientY;
            }
            var startY = NaN;
            function updateOffsetY(offsetY) {
                if ($scope.wheelOptions.length == 0)
                    return;
                $scope.selectedY = initY + offsetY;
                var offset = Math.round(offsetY / lineHeight);
                if (offset == 0)
                    return;
                var current = $scope.wheelOptions.indexOf($scope.wheelSelected);
                var index = current - offset;
                if (index < 0 || $scope.wheelOptions.length <= index)
                    return;
                $scope.wheelSelected = $scope.wheelOptions[index];
                var moveY = (index - current) * lineHeight;
                $scope.selectedY = $scope.selectedY + moveY;
                startY = startY - moveY;
            }
            function start(e) {
                e.preventDefault();
                startY = getEventY(e);
            }
            function move(e) {
                e.preventDefault();
                if (Number.isNaN(startY))
                    return;
                updateOffsetY(getEventY(e) - startY);
                $scope.$apply();
            }
            function end(e) {
                e.preventDefault();
                if (Number.isNaN(startY))
                    return;
                updateOffsetY(getEventY(e) - startY);
                $scope.selectedY = initY;
                startY = NaN;
                $scope.$apply();
            }
            function cancel(e) {
                e.preventDefault();
                if (Number.isNaN(startY))
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
    };
}
