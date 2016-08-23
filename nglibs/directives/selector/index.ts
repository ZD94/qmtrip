"use strict";

import angular = require('angular');

angular
    .module('nglibs')
    .directive('ngSelectorList', function() {
        return {
            restrict: 'E',
            template: require('./list.html'),
            scope: {
                value: '=ngModel',
                noticeMsg: '@dlgNoticeMsg',
                title: '@dlgTitle',
                placeholder: '@dlgPlaceholder',
                options: '=dlgOptions'
            },
            controller: function($scope, $element, ngModalDlg) {
                $scope.displayItem = function(item) {
                    if(item && $scope.options && $scope.options.display) {
                        return $scope.options.display(item, false);
                    }
                    return item;
                };
                $scope.showSelectorDlg = async function() {
                    $scope.options.title = $scope.title;
                    $scope.options.placeholder = $scope.placeholder;
                    $scope.options.noticeMsg = $scope.noticeMsg;
                    var value: any = await ngModalDlg.selectFromList($scope, $scope.options, $scope.value)
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
    .directive('ngSelectorMap', function() {
        return {
            restrict: 'E',
            template: require('./map.html'),
            scope: {
                value: '=ngModel',
                title: '@dlgTitle',
                placeholder: '@dlgPlaceholder',
                city: '<dlgPlace',
                options: '=dlgOptions'
            },
            controller: function($scope, ngModalDlg) {
                $scope.showSelectorDlg = async function() {
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
                options: '=dlgOptions'
            },
            controller: function($scope, ngModalDlg) {
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
    });


