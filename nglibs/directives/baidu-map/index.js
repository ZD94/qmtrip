"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require('angular');
var defaults_1 = require("./defaults");
var validator_1 = require("./validator");
var baiduScriptLoader_1 = require("./baiduScriptLoader");
var offline_1 = require("./style/offline");
var map_1 = require("./map");
//declare var BMap;
angular
    .module('nglibs')
    .directive('baiduMap', function () {
    return {
        restrict: 'E',
        scope: {
            options: '=',
            ak: '@',
            offline: '=',
            onMapLoaded: '&'
        },
        controller: function ($scope, $element) {
            //var opts = angular.extend({}, defaultOpts, $scope['options']);
            //var offlineOpts = angular.extend({}, defaultOfflineOpts, $scope['offline']);
        },
        link: function ($scope, $element, attrs) {
            var opts = angular.extend({}, defaults_1.defaultOpts, $scope['options']);
            validator_1.validator($scope['ak'], 'ak must not be empty');
            validator_1.validator(opts.center, 'options.center must be set');
            if (typeof opts.center != 'string') {
                validator_1.validator(opts.center.longitude, 'options.center.longitude must be set');
                validator_1.validator(opts.center.latitude, 'options.center.latitude must be set');
            }
            validator_1.validator(opts.city, 'options.city must be set');
            $scope['divStyle'] = offline_1.divStyle;
            $scope['labelStyle'] = offline_1.labelStyle;
            //setTimeout(function() {
            //    //var $label = document.querySelector('baidu-map div label');
            //    var $label = $element.find('div label');
            //    $scope['labelStyle'].marginTop = $label.clientHeight / -2 + 'px';
            //    $scope['labelStyle'].marginLeft = $label.clientWidth / -2 + 'px';
            //    $scope.$apply();
            //});
            var offlineOpts = angular.extend({}, defaults_1.defaultOfflineOpts, $scope['offline']);
            $scope['offlineWords'] = offlineOpts.txt;
            baiduScriptLoader_1.loader($scope['ak'], offlineOpts, function () {
                map_1.createInstance(opts, $element, function (map) {
                    var $label = $element.find('div label');
                    $scope['labelStyle'].marginTop = $label.clientHeight / -2 + 'px';
                    $scope['labelStyle'].marginLeft = $label.clientWidth / -2 + 'px';
                    $scope['onMapLoaded']({ map: map });
                    $scope.$applyAsync();
                    //create markers
                    var previousMarkers = [];
                    map_1.redrawMarkers(map, previousMarkers, opts);
                    $scope.$watch('options.markers', function (newValue, oldValue) {
                        map_1.redrawMarkers(map, previousMarkers, opts);
                    }, true);
                    //$scope.$watch('options.center', function(newValue, oldValue) {
                    //    opts = $scope['options'];
                    //    map.centerAndZoom(new BMap.Point(opts.center.longitude,
                    //        opts.center.latitude), opts.zoom);
                    //    redrawMarkers(map, previousMarkers, opts);
                    //}, true);
                });
            });
        },
        template: '<div ng-style="divStyle"><label ng-style="labelStyle">{{ offlineWords }}</label></div>'
    };
});
