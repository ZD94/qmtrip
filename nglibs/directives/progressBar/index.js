/**
 * Created by seven on 16/6/6.
 */
"use strict";
// import angular = require('angular');
angular
    .module('nglibs')
    .directive('progressBar', function () {
    require('./progress-bar.scss');
    return {
        restrict: 'AE',
        replace: true,
        transclude: true,
        scope: {
            all: '@',
            cover: '@',
            color: '@',
            title: '@?'
        },
        template: '<div class="progressBar"><span ng-transclude></span> <div class="bar-bg"><div class="cover" style="border-radius: 5px; background: {{color}}; width: {{coverPercent}};"></div></div>&nbsp;&nbsp;{{title}}</div>',
        controller: function ($scope) {
            var all = $scope.all || 1;
            var cover = $scope.cover;
            $scope.coverPercent = ((cover / all) * 100) + '%';
            if (!$scope.color) {
                $scope.color = 'red';
            }
            $scope.$watch('all', function (newValue, oldValue) {
                if (newValue == oldValue)
                    return;
                $scope.coverPercent = (($scope.cover / (newValue || 1)) * 100) + '%';
            });
            $scope.$watch('cover', function (newValue, oldValue) {
                if (newValue == oldValue)
                    return;
                $scope.coverPercent = ((newValue / ($scope.all || 1)) * 100) + '%';
            });
        }
    };
});
