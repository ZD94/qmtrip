"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
angular
    .module('nglibs')
    .directive('ngSelect', function () {
    require('./select.scss');
    return {
        priority: 1001,
        restrict: 'A',
        template: require('./select.html'),
        replace: true,
        transclude: 'element',
        scope: {
            ngModel: '='
        },
        controller: function ($scope, $element) {
            $scope.optionmap = {};
            $scope.optionval = '';
            $scope.show_options = function ($event) {
                $element.find('.dropdown').toggle();
            };
            $scope.select_option = function ($event) {
                $element.find('.dropdown').hide();
                $scope.optionval = $($event.target).attr('checkvalue');
                var select = $element.find("select");
                select.val($scope.optionval);
                process.nextTick(function () {
                    select.trigger('change');
                });
            };
            $scope.$watch('ngModel', function () {
                process.nextTick(function () {
                    $scope.optionval = $element.find("select").val();
                    $scope.$apply();
                });
            });
        },
        compile: function (element, attr, trans) {
            element.removeAttr("ng-options");
            element.removeAttr("ng-model");
            return function (scope, element, attr, controller, transcludeFn) {
                element.find("option").each(function (index, option) {
                    scope.optionmap[option.value] = option.innerHTML;
                });
            };
        }
    };
});
