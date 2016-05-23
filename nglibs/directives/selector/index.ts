"use strict";

import angular = require('angular');

declare var API: any;

async function showSelectorModal($scope, $ionicModal, selected, optionsLoader) {
    var template = require('./selector.html');
    $scope.modal = $ionicModal.fromTemplate(template, {
        scope: $scope,
        animation: 'slide-in-up'
    });
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    $scope.$on('modal.hidden', function() {
    });
    $scope.$on('modal.removed', function() {
    });

    var form: any = $scope.form = {};
    form.keyword = selected;
    form.selected = selected;
    $scope.optionLoader = async function(){
        $scope.options = await optionsLoader(form.keyword);
    }

    $scope.$watch('form.keyword', function(o, n) {
        if(o === n)
            return;
        $scope.optionLoader();
    })
    $scope.options = [];
    $scope.optionLoader();
    
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
                getOptionsLoader: '&ngSelector',
                value: '=ngModel'
            },
            controller: function($scope, $element, $ionicModal) {
                $element.focus(async function() {
                    var value = await showSelectorModal($scope, $ionicModal, $scope.value, $scope.getOptionsLoader())
                    if(value == undefined)
                        return;
                    console.log(value);
                    $scope.value = value;
                })
            }
        }
    });


