"use strict";

import angular = require('angular');
import { modalSelectorList } from './selector-list';
import { modalSelectorMap } from './selector-map';
import { modalSelectorDate } from './selector-date';


class ngSelectorDialog{
    constructor(private $ionicModal, private $ionicPopup){

    }

    list($scope, callbacks, value){
        return modalSelectorList($scope, this.$ionicModal, callbacks, value);
    }
    map($scope, city, value){
        return modalSelectorMap($scope, this.$ionicModal, city, value);
    }
    date($scope, options, value){
        return modalSelectorDate($scope, this.$ionicModal, this.$ionicPopup, options, value);
    }
}

angular
    .module('nglibs')
    .service('ngSelectorDialog', ngSelectorDialog)
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
            controller: function($scope, $element, ngSelectorDialog) {
                $scope.showSelectorDlg = async function() {
                    var value: any = await ngSelectorDialog.list($scope, $scope.callbacks, $scope.value)
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
                city: '<ngSelectorPlace',
                placeholder: '@ngSelectorPlaceholder',
                callbacks: '=ngSelectorMap'
            },
            controller: function($scope, ngSelectorDialog) {
                $scope.showSelectorDlg = async function() {
                    var value: any = await ngSelectorDialog.map($scope, $scope.city, $scope.value)
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
            controller: function($scope, ngSelectorDialog) {
                $scope.showSelectorDlg = async function() {
                    var confirmed = await ngSelectorDialog.date($scope, $scope.options, $scope.value)
                    if(!confirmed)
                        return;
                    $scope.value = confirmed;
                    if ($scope.options.done && typeof $scope.options.done == 'function') {
                        return $scope.options.done($scope.value);
                    }
                };
            }
        }
    });


