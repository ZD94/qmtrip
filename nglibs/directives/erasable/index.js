"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
angular
    .module('nglibs')
    .directive("erasable", function () {
    return {
        priority: 1001,
        restrict: 'A',
        replace: true,
        transclude: "element",
        template: '<div><a class="clear_input web-icon-font" ng-click="clear_val($event)">&#xf057;</a></div>',
        controller: function ($scope, $element, $transclude) {
            $scope.clear_val = function ($event) {
                //console.log('clear_val');
                $($event.target).siblings('input').val('');
                //console.info(222);
                //var input = $element.find("input");
                //process.nextTick(function(){
                //    input.trigger('change');
                //});
            };
        },
        compile: function (element, attrs, $transclude) {
            element.removeAttr("ng-model");
            //element.css("width",element.find("input").width())
            //console.info(element.find("input").width());
            return function (scope, element, attrs, ctrl, transclude) {
                transclude(function (clone, scope) {
                    clone.attr('required', 'true');
                    clone.removeClass();
                    clone.addClass('input');
                    element.prepend(clone);
                });
            };
        }
    };
});
