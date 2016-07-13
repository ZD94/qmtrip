var angular = require('angular');
import { defaultOpts, defaultOfflineOpts } from './defaults';
import { validator } from './validator';
import { loader } from './baiduScriptLoader';
import { divStyle, labelStyle } from './style/offline';
import { createInstance, redrawMarkers } from './map';

declare var BMap;

angular
    .module('nglibs')
    .directive('baiduMap', function() {
            return {
                restrict: 'E',
                scope: {
                    options: '=',
                    ak: '@',
                    offline: '=',
                    onMapLoaded: '&'
                },
                controller: function($scope, $element){
                    var opts = angular.extend({}, defaultOpts, $scope['options']);
                    var offlineOpts = angular.extend({}, defaultOfflineOpts, $scope['offline']);


                },
                link: function($scope, $element, attrs) {
                    var opts = angular.extend({}, defaultOpts, $scope['options']);
                    validator($scope['ak'], 'ak must not be empty');
                    validator(opts.center, 'options.center must be set');
                    if(typeof opts.center != 'string'){
                        validator(opts.center.longitude, 'options.center.longitude must be set');
                        validator(opts.center.latitude, 'options.center.latitude must be set');
                    }
                    validator(opts.city, 'options.city must be set');


                    $scope['divStyle'] = divStyle;
                    $scope['labelStyle'] = labelStyle;
                    //setTimeout(function() {
                    //    //var $label = document.querySelector('baidu-map div label');
                    //    var $label = $element.find('div label');
                    //    $scope['labelStyle'].marginTop = $label.clientHeight / -2 + 'px';
                    //    $scope['labelStyle'].marginLeft = $label.clientWidth / -2 + 'px';
                    //    $scope.$apply();
                    //});


                    var offlineOpts = angular.extend({}, defaultOfflineOpts, $scope['offline']);
                    $scope['offlineWords'] = offlineOpts.txt;
                    loader($scope['ak'], offlineOpts, function() {
                        createInstance(opts, $element, function(map){

                            var $label = $element.find('div label');
                            $scope['labelStyle'].marginTop = $label.clientHeight / -2 + 'px';
                            $scope['labelStyle'].marginLeft = $label.clientWidth / -2 + 'px';
                            $scope['onMapLoaded']({map});
                            $scope.$applyAsync();

                            //create markers
                            var previousMarkers = [];
                            redrawMarkers(map, previousMarkers, opts);
                            $scope.$watch('options.markers', function(newValue, oldValue) {
                                redrawMarkers(map, previousMarkers, opts);
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
            }
        }
    );
