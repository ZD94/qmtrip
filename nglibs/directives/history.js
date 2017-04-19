"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
angular
    .module('nglibs')
    .directive('noHistory', ['$ionicHistory', function ($ionicHistory) {
        return {
            restrict: 'AC',
            link: function ($scope, $element) {
                $element.bind('click', function () {
                    $ionicHistory.nextViewOptions({
                        historyRoot: true,
                        expire: 300
                    });
                });
            }
        };
    }])
    .directive('noBack', ['$ionicHistory', function ($ionicHistory) {
        return {
            restrict: 'AC',
            link: function ($scope, $element) {
                $element.bind('click', function () {
                    $ionicHistory.nextViewOptions({
                        disableBack: true,
                        expire: 300
                    });
                });
            }
        };
    }]);
