"use strict";

import angular = require('angular');
import { modalSelectorList } from './list';
import { modalSelectorMap } from './map';
import { modalSelectorDate } from './date';
import { modalSelectorDatespan } from './date';

class ngSelector {
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
            this.$injector.invoke(controller, this, {$scope, $element: modal.$el.find('ion-modal-view')});
        });
    }

    list($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: {options, value},
            template: require('./list/dialog.html'),
            controller: modalSelectorList
        });
        //return modalSelectorList($scope, this.$ionicModal, callbacks, value);
    }

    map($scope, city, value) {
        return this.createDialog({
            parent: $scope,
            scope: {city, value},
            template: require('./map/dialog.html'),
            controller: modalSelectorMap
        });
        //return modalSelectorMap($scope, this.$ionicModal, city, value);
    }

    date($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: {options, value},
            template: require('./date/dialog.html'),
            controller: modalSelectorDate
        });
        //return modalSelectorDate($scope, this.$ionicModal, this.$ionicPopup, options, value);
    }

    datespan($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: {options, value},
            template: require('./datespan/dialog.html'),
            controller: modalSelectorDatespan
        });
        //return modalSelectorDate($scope, this.$ionicModal, this.$ionicPopup, options, value);
    }
}

angular
    .module('nglibs')
    .service('ngSelector', ngSelector)
    .directive('ngSelectorList', function() {
        require('./selector.scss');
        return {
            restrict: 'E',
            template: require('./list/element.html'),
            scope: {
                value: '=ngModel',
                noticeMsg: '@dlgNoticeMsg',
                title: '@dlgTitle',
                placeholder: '@dlgPlaceholder',
                options: '=dlgOptions'
            },
            controller: function($scope, $element, ngSelector) {
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
                    var value: any = await ngSelector.list($scope, $scope.options, $scope.value)
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
        require('./selector.scss');
        return {
            restrict: 'E',
            template: require('./map/element.html'),
            scope: {
                value: '=ngModel',
                title: '@dlgTitle',
                city: '<dlgPlace',
                placeholder: '@dlgPlaceholder',
                callbacks: '=dlgOptions'
            },
            controller: function($scope, ngSelector) {
                $scope.showSelectorDlg = async function() {
                    var value: any = await ngSelector.map($scope, $scope.city, $scope.value)
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
        require('./selector.scss');
        return {
            restrict: 'E',
            template: require('./date/element.html'),
            scope: {
                value: '=ngModel',
                title: '@dlgTitle',
                placeholder: '@dlgPlaceholder',
                options: '=dlgOptions'
            },
            controller: function($scope, ngSelector) {
                $scope.showSelectorDlg = async function() {
                    var confirmed = await ngSelector.date($scope, $scope.options, $scope.value)
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


