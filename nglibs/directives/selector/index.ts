"use strict";

import angular = require('angular');

angular
    .module('nglibs')
    .directive('ngBindTemplateTemplate', function($compile){
        return {
            restrict: 'A',
            scope: {
                'template': '=ngBindTemplateTemplate'
            },
            link: function(scope, elem, attrs, controller, transcludeFn){
                let template = angular.element('<div>'+scope.template+'</div>');
                let child = $compile(template)(scope.$parent);
                elem.append(child);
            }
        }
    })
    .directive('ngSelectorList', function() {
        return {
            restrict: 'E',
            template: require('./list.html'),
            scope: {
                value: '=ngModel',
                noticeMsg: '@dlgNoticeMsg',
                title: '@dlgTitle',
                placeholder: '@dlgPlaceholder',
                opts: '=dlgOptions'
            },
            controller: function($scope, $element, ngModalDlg) {
                $scope.displayItem = function(item) {
                    if(item && $scope.opts && $scope.opts.display) {
                        return $scope.opts.display(item, false);
                    }
                    return item;
                };
                $scope.showSelectorDlg = async function() {
                    $scope.opts.title = $scope.title;
                    $scope.opts.placeholder = $scope.placeholder;
                    $scope.opts.noticeMsg = $scope.noticeMsg;
                    var value: any = await ngModalDlg.selectFromList($scope, $scope.opts, $scope.value)
                    if(value == undefined)
                        return;
                    $scope.value = value;

                    if($scope.opts.done && typeof $scope.opts.done == 'function') {
                        return $scope.opts.done(value);
                    }
                };
            }
        }
    })
    .directive('ngSelectorMap', function() {
        return {
            restrict: 'E',
            template: require('./map.html'),
            scope: {
                value: '=ngModel',
                title: '@dlgTitle',
                placeholder: '@dlgPlaceholder',
                city: '<dlgPlace',
                longitude: '<dlgLongitude',
                latitude: '<dlgLatitude',
                options: '=dlgOptions'
            },
            controller: function($scope, ngModalDlg) {
                $scope.showSelectorDlg = async function() {
                    if ($scope.latitude && $scope.longitude) {
                        $scope.options.latitude = $scope.latitude;
                        $scope.options.longitude = $scope.longitude;
                    }
                    $scope.options.city = $scope.city;
                    var value: any = await ngModalDlg.selectMapPoint($scope, $scope.options, $scope.value)
                    if(value == undefined)
                        return;

                    $scope.value = value;

                    if($scope.options.done && typeof $scope.options.done == 'function') {
                        return $scope.options.done(value);
                    }
                };
            }
        }
    })
    .directive('ngSelectorDate', function() {
        return {
            restrict: 'E',
            template: require('./date.html'),
            scope: {
                value: '=ngModel',
                title: '@dlgTitle',
                options: '=dlgOptions',
                filters: '@dateFilter'  //日期返回格式filter  字符串即可
            },
            controller: function($scope, ngModalDlg) {
                $scope.datefilter = $scope.filters || 'yyyy-MM-dd HH:mm';
                $scope.showSelectorDlg = async function() {
                    $scope.options.title = $scope.title;
                    var confirmed = await ngModalDlg.selectDate($scope, $scope.options, $scope.value)
                    if(!confirmed)
                        return;
                    $scope.value = confirmed;
                    if($scope.options.done && typeof $scope.options.done == 'function') {
                        return $scope.options.done($scope.value);
                    }
                };
            }
        }
    })
    .directive('ngSelectorListTwo', function($compile) {
        return {
            restrict: 'E',
            template: require('./list2.html'),
            scope: {
                value: '=ngModel',
                name: '@selectName',
                must: '@must',
                showArrow: '@showArrow',
                noticeMsg: '@dlgNoticeMsg',
                title: '@dlgTitle',
                placeholder: '@dlgPlaceholder',
                opts: '=dlgOptions'
            },
            controller: function($scope, $element, ngModalDlg) {
                require('./selector.scss');
                $scope.$item = $scope.value;
                $scope.$watch('value', function(){
                    $scope.$item = $scope.value;
                })
                //let template = $scope.opts.titleTemplate || $scope.opts.itemTemplate;
                $scope.displayItem = function(item) {
                    if(!$scope.opts)
                        return 'null';
                    return $scope.opts.titleTemplate;
                    // let compiled = $compile(angular.element('<div>'+template+'</div>'));
                    // let element = compiled($scope);
                    // return element.text();
                };
                $scope.showSelectorDlg = async function() {
                    $scope.opts.title = $scope.title;
                    $scope.opts.placeholder = $scope.placeholder;
                    $scope.opts.noticeMsg = $scope.noticeMsg;
                    var value: any = await ngModalDlg.selectFromList($scope, $scope.opts, $scope.value)
                    if(value == undefined)
                        return;
                    $scope.value = value;

                    if($scope.opts.done && typeof $scope.opts.done == 'function') {
                        return $scope.opts.done(value);
                    }
                };
            }
        }
    })
    .directive('ngSelectorMapTwo', function() {
        return {
            restrict: 'E',
            template: require('./map2.html'),
            scope: {
                value: '=ngModel',
                name: '@selectName',
                must: '@must',
                showArrow: '@showArrow',
                title: '@dlgTitle',
                placeholder: '@dlgPlaceholder',
                city: '<dlgPlace',
                longitude: '<dlgLongitude',
                latitude: '<dlgLatitude',
                options: '=dlgOptions'
            },
            controller: function($scope, ngModalDlg) {
                require('./selector.scss');
                $scope.showSelectorDlg = async function() {
                    if ($scope.latitude && $scope.longitude) {
                        $scope.options.latitude = $scope.latitude;
                        $scope.options.longitude = $scope.longitude;
                    }
                    $scope.options.city = $scope.city;
                    var value: any = await ngModalDlg.selectMapPoint($scope, $scope.options, $scope.value)
                    if(value == undefined)
                        return;

                    $scope.value = value;

                    if($scope.options.done && typeof $scope.options.done == 'function') {
                        return $scope.options.done(value);
                    }
                };
            }
        }
    })
    .directive('ngSelectorDateTwo', function() {
        return {
            restrict: 'E',
            template: require('./date2.html'),
            scope: {
                value: '=ngModel',
                showArrow: '@showArrow',
                must: '@must',
                name: '@selectName',
                title: '@dlgTitle',
                options: '=dlgOptions',
                filters: '@dateFilter'  //日期返回格式filter  字符串即可
            },
            controller: function($scope, ngModalDlg) {
                require('./selector.scss');
                $scope.datefilter = $scope.filters || 'yyyy-MM-dd HH:mm';
                $scope.showSelectorDlg = async function() {
                    $scope.options.title = $scope.title;
                    var confirmed = await ngModalDlg.selectDate($scope, $scope.options, $scope.value)
                    if(!confirmed)
                        return;
                    $scope.value = confirmed;
                    if($scope.options.done && typeof $scope.options.done == 'function') {
                        return $scope.options.done($scope.value);
                    }
                };
            }
        }
    })

