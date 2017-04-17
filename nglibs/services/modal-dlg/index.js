"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../index");
var list_1 = require("./list");
var map_1 = require("./map");
var date_1 = require("./date");
var index_2 = require("./city/index");
var ngModalDlg = (function () {
    function ngModalDlg($ionicModal, $injector, $loading) {
        this.$ionicModal = $ionicModal;
        this.$injector = $injector;
        this.$loading = $loading;
        require('./modal-dialog.scss');
    }
    ngModalDlg.prototype.createDialog = function (options) {
        var _this = this;
        var self = this;
        var scope = options.scope, parent = options.parent, template = options.template, controller = options.controller, notHideOnConfiom = options.notHideOnConfiom, animation = options.animation;
        return new Promise(function (resolve, reject) {
            var modal = _this.$ionicModal.fromTemplate(template, {
                scope: parent,
                animation: animation || 'slide-in-up',
                focusFirstInput: false
            });
            var $scope = modal.scope;
            for (var k in scope) {
                $scope[k] = scope[k];
            }
            $scope.modal = modal;
            var confirmed = false;
            //$scope.$on('$destroy', function() {
            //});
            var deregState = parent.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                event.preventDefault();
                modal.hide();
                self.$loading.end();
            });
            var deregHidden = parent.$on('modal.hidden', function (event, from) {
                if (from != modal)
                    return;
                modal.remove();
                modal = undefined;
                $scope.confirmModal();
            });
            var deregRemove = parent.$on('modal.removed', function (event, from) {
                if (from != modal)
                    return;
                $scope.$destroy();
                deregHidden();
                deregRemove();
                deregState();
            });
            $scope.confirmModal = function (value) {
                if (confirmed)
                    return;
                confirmed = true;
                if (modal && !notHideOnConfiom)
                    modal.hide();
                resolve(value);
            };
            modal.show();
            self.$injector.invoke(controller, self, { $scope: $scope, $element: modal.$el.find('ion-modal-view') });
        });
    };
    ngModalDlg.prototype.selectFromList = function ($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: { options: options, value: value },
            template: require('./list/dialog.html'),
            controller: list_1.selectFromListController
        });
    };
    ngModalDlg.prototype.selectMapPoint = function ($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: { options: options, value: value },
            template: require('./map/dialog.html'),
            controller: map_1.selectMapPointController
        });
    };
    ngModalDlg.prototype.selectDate = function ($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: { options: options, value: value },
            template: require('./date/dialog.html'),
            controller: date_1.selectDateController
        });
    };
    ngModalDlg.prototype.selectDateSpan = function ($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: { options: options, value: value },
            template: require('./date/datespan-dialog.html'),
            controller: date_1.selectDateSpanController
        });
    };
    ngModalDlg.prototype.selectCity = function ($scope, options, val) {
        return this.createDialog({
            parent: $scope,
            scope: { options: options, val: val },
            template: require('./city/dialog.html'),
            controller: index_2.selectCityListController
        });
    };
    return ngModalDlg;
}());
ngModalDlg = __decorate([
    index_1.ngService('ngModalDlg')
], ngModalDlg);
