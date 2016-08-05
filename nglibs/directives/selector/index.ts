"use strict";

import angular = require('angular');
import { modalSelectorList } from './selector-list';
import { modalSelectorMap } from './selector-map';
import { modalSelectorDate } from './selector-date';

class ngSelectorDialog {
    constructor(private $ionicModal, private $ionicPopup, private $injector) {

    }

    createDialog({scope, parent, template, controller}) {
        return new Promise((resolve, reject) => {
            let modal = this.$ionicModal.fromTemplate(template, {
                scope: parent,
                animation: 'slide-in-up',
                focusFirstInput: false
            });
            let $scope = modal.scope;
            for(let k in scope) {
                $scope[k] = scope[k];
            }
            $scope.modal = modal;
            let result;
            //$scope.$on('$destroy', function() {
            //});
            parent.$on('modal.hidden', function() {
                modal.remove();
                resolve(result);
            });
            parent.$on('modal.removed', function() {
                $scope.$destroy();
            });

            $scope.confirmModal = function(value) {
                result = value;
                modal.hide();
            }
            modal.show();
            this.$injector.invoke(controller, this, {$scope, $element: modal.$el});
        });
    }

    list($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: {options, value},
            template: require('./selector-list-dialog.html'),
            controller: modalSelectorList
        });
        //return modalSelectorList($scope, this.$ionicModal, callbacks, value);
    }

    map($scope, city, value) {
        return this.createDialog({
            parent: $scope,
            scope: {city, value},
            template: require('./selector-map-dialog.html'),
            controller: modalSelectorMap
        });
        //return modalSelectorMap($scope, this.$ionicModal, city, value);
    }

    date($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: {options, value},
            template: require('./selector-date-dialog.html'),
            controller: modalSelectorDate
        });
        //return modalSelectorDate($scope, this.$ionicModal, this.$ionicPopup, options, value);
    }
}

angular
    .module('nglibs')
    .service('ngSelectorDialog', ngSelectorDialog)
    .directive('ngSelector', function() {
        require('./selector-list.scss');
        return {
            restrict: 'A',
            template: require('./selector-list.html'),
            scope: {
                value: '=ngModel',
                noticeMsg: '@ngNoticeMsg',
                title: '@ngSelectorTitle',
                placeholder: '@ngSelectorPlaceholder',
                options: '=ngSelector'
            },
            controller: function($scope, $element, ngSelectorDialog) {
                $scope.displayItem = function(item){
                    if(item && $scope.options && $scope.options.display){
                        return $scope.options.display(item, false);
                    }
                    return item;
                };
                $scope.showSelectorDlg = async function() {
                    $scope.options.title = $scope.title;
                    $scope.options.placeholder = $scope.placeholder;
                    $scope.options.noticeMsg = $scope.noticeMsg;
                    var value: any = await ngSelectorDialog.list($scope, $scope.options, $scope.value)
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

                    if($scope.callbacks.done && typeof $scope.callbacks.done == 'function') {
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
                    if($scope.options.done && typeof $scope.options.done == 'function') {
                        return $scope.options.done($scope.value);
                    }
                };
            }
        }
    });


