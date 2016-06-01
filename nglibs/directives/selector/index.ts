"use strict";

import angular = require('angular');

declare var API: any;

async function showSelectorModal($scope, $ionicModal, selected) {
    var template = require('./selector.html');
    $scope.modal = $ionicModal.fromTemplate(template, {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    });
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    $scope.$on('modal.hidden', function() {
    });
    $scope.$on('modal.removed', function() {
    });

    var optionsLoader = $scope.getOptionsLoader();
    var optionsCreator = $scope.getOptionsCreator();

    var form: any = $scope.form = {};
    form.keyword = selected;
    form.selected = '';

    $scope.optionLoader = async function(){
        $scope.options = await optionsLoader(form.keyword);
    }

    $scope.$watch('form.keyword', function(o, n) {
        if(o === n)
            return;
        $scope.optionLoader();
    })
    $scope.options = [];
    await $scope.optionLoader();
    //需要等待加载完数据后
    $scope.options.map(function(v) {
        if (v.name == selected) {
            form.selected = v;
            return;
        }
    });

    $scope.showCreate = function(){
        if(optionsCreator == undefined)
            return false;
        if(!form.keyword || form.keyword.length == 0)
            return false;

        let isMatch = false;
        $scope.options.forEach(function(v) {
            if (v == form.keyword || v.name == form.keyword) {
                isMatch = true;
                return;
            }
        });

        if(isMatch) return false;
        return true;
    }
    
    return new Promise(function(resolve, reject) {
        $scope.confirmModal = function() {
            $scope.modal.hide();
            resolve($scope.form.selected);
        }
        $scope.cancelModal = function() {
            $scope.modal.hide();
            resolve();
        }
        $scope.modal.show();

    })

}

angular
    .module('nglibs')
    .directive('ngSelector', function() {
        return {
            restrict: 'A',
            scope: {
                value: '=ngModel',
                title: '@ngSelectorTitle',
                placeholder: '@ngSelectorPlaceholder',
                getOptionsLoader: '&ngSelectorQuery',
                getOptionsCreator: '&ngSelectorCreate',
                done: '=ngSelectorDone'
            },
            controller: function($scope, $element, $ionicModal) {
                $element.focus(async function() {
                    var value: any = await showSelectorModal($scope, $ionicModal, $scope.value)
                    if(value == undefined)
                        return;

                    if (!value.name) {
                        $scope.value = value;
                    } else {
                        $scope.value = value.name;
                    }

                    if ($scope.done && typeof $scope.done == 'function') {
                        return $scope.done(value);
                    }
                })
            }
        }
    });


