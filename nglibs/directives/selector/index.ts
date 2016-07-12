"use strict";

import angular = require('angular');
import { modalSelectorList } from './selector-list';
import { modalSelectorMap } from './selector-map';

angular
    .module('nglibs')
    .directive('ngSelector', function() {
        return {
            restrict: 'A',
            template: require('./selector.html'),
            scope: {
                value: '=ngModel',
                title: '@ngSelectorTitle',
                placeholder: '@ngSelectorPlaceholder',
                callbacks: '=ngSelector'
            },
            controller: function($scope, $element, $ionicModal) {
                $scope.showSelectorList = async function() {
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
            template: require('./selector.html'),
            scope: {
                value: '=ngModel',
                title: '@ngSelectorTitle',
                city: '<ngSelectorCity',
                placeholder: '@ngSelectorPlaceholder',
                callbacks: '=ngSelectorMap'
            },
            controller: function($scope, $element, $compile, $ionicModal) {
                $scope.showSelectorList = async function() {
                    var value: any = await modalSelectorMap($compile, $scope, $element, $ionicModal, $scope.value)
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
    });


