"use strict";

import angular = require('angular');

angular
    .module('nglibs')
    .directive('ngBindTemplateTemplate', function($compile){
        return {
            restrict: 'A',
            scope: {
                'options': '&ngBindTemplateTemplate',
                'inject': '&inject'
            },
            link: function(scope, elem, attrs, controller, transcludeFn){
                let options = scope["options"]();
                let inject = scope["inject"]();
                let parent = options.scope || scope;
                let childScope = parent.$new(false);
                Object.keys(inject).forEach((k)=>{
                    childScope[k] = inject[k];
                })
                let template = angular.element('<div>'+options.template+'</div>');
                let child = $compile(template)(childScope);
                elem.append(child);
            }
        }
    })
    .directive('ngBindTransclude', function(){
        return {
            restrict: 'A',
            scope: {
                'options': '&ngBindTransclude',
                'inject': '&inject'
            },
            link: function(scope, elem, attrs, controller, transcludeFn){
                let options = scope["options"]();
                let inject = scope["inject"]();
                let parent = options.scope || scope;
                let childScope = parent.$new(false);
                Object.keys(inject).forEach((k)=>{
                    childScope[k] = inject[k];
                })
                options.transclude(childScope, function(clone){
                    elem.append(clone);
                }, elem, options.slot);
            }
        }
    })
    .directive('ngSelectorList', function() {
        return {
            restrict: 'E',
            template: require('./list.html'),
            transclude:{
                listItem: 'listItem',
                inputItem: '?inputItem'
            },
            scope: {
                value: '=ngModel',
                placeholder: '@dlgPlaceholder',
                opts: '=dlgOptions'
            },
            controller: function($scope, $element, $transclude, ngModalDlg) {
                require('./selector.scss');
                $scope.showSelectorDlg = async function() {
                    $scope.opts.placeholder = $scope.placeholder;
                    $scope.opts.transclude = {
                        transclude: $transclude,
                        scope: $scope.$parent,
                        slot: 'listItem',
                    };
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

