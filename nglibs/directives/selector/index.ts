"use strict";

import angular = require('angular');
import { modalSelectorList } from './selector-list';
import { modalSelectorMap } from './selector-map';
import { modalSelectorDate } from './selector-date';

angular
    .module('nglibs')
    .directive('ngSelector', function() {
        return {
            restrict: 'A',
            template: require('./selector-list.html'),
            scope: {
                value: '=ngModel',
                noticeMsg: '@ngNoticeMsg',
                title: '@ngSelectorTitle',
                placeholder: '@ngSelectorPlaceholder',
                callbacks: '=ngSelector'
            },
            controller: function($scope, $element, $ionicModal) {
                $scope.showSelectorDlg = async function() {
                    var value: any = await modalSelectorList($scope, $ionicModal, $scope.value)
                    if(value == undefined)
                        return;

                    if (!value.name) {
                        $scope.value = value;
                    } else {
                        $scope.value = value.name;
                    }

                    if ($scope.callbacks.done && typeof $scope.callbacks.done == 'function') {
                        return $scope.callbacks.done(value);
                    }
                };
            }
        }
    })
    .directive('ngSelectorMap', function() {
        require('./selector-map.scss');
        return {
            restrict: 'A',
            template: require('./selector-map.html'),
            scope: {
                value: '=ngModel',
                title: '@ngSelectorTitle',
                city: '<ngSelectorCity',
                placeholder: '@ngSelectorPlaceholder',
                callbacks: '=ngSelectorMap'
            },
            controller: function($scope, $ionicModal) {
                $scope.showSelectorDlg = async function() {
                    var value: any = await modalSelectorMap($scope, $ionicModal, $scope.value)
                    if(value == undefined)
                        return;

                    $scope.value = value;

                    if ($scope.callbacks.done && typeof $scope.callbacks.done == 'function') {
                        return $scope.callbacks.done(value);
                    }
                };
            }
        }
    })
    .directive('ngSelectorDate', function() {
        require('./selector-date.scss');
        return {
            restrict: 'A',
            template: require('./selector-date.html'),
            scope: {
                value: '=ngModel',
                title: '@ngSelectorTitle',
                placeholder: '@ngSelectorPlaceholder',
                options: '=ngSelectorDate'
            },
            controller: function($scope, $ionicModal, $ionicPopup) {
                $scope.showSelectorDlg = async function() {
                    var confirmed = await modalSelectorDate($scope, $ionicModal, $ionicPopup)
                    if(!confirmed)
                        return;

                    if ($scope.options.done && typeof $scope.options.done == 'function') {
                        return $scope.options.done($scope.value);
                    }
                };
            }
        }
    });


