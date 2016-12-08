/**
 * Created by seven on 16/9/14.
 */
"use strict";

import angular = require("angular");
import moment = require('moment');
import {QMEApproveStatus, EApproveStatus2Text, EInvoiceType, ETripType, MTxPlaneLevel} from "api/_types/tripPlan";
angular
    .module('nglibs')
    .directive('tripApprove', function(){
        return {
            restrict: 'AE',
            template: require('./trip-approve.html'),
            replace: true,
            transclude: false,
            scope: {
                tripApprove: '=data',
                showHeaderTxt: '@showHeader', //是否显示提交人信息
                showDetailStatus: '@',  //是否显示详细状态,如果为false,则只显示[审批通过,审批未通过,待审批]
                click: '='
            },
            controller: function($scope, $ionicPopup) {
                $scope.EApproveStatus = QMEApproveStatus;
                $scope.showHeader = $scope.showHeaderTxt != 'false';
                $scope.showDetailStatus = Boolean($scope.showDetailStatus);
                $scope.click = $scope.click || function(trip) { console.info('click me...');}
                $scope.aboutSpecial = function(){
                    $ionicPopup.show({
                        title: '关于特别审批',
                        cssClass: 'aboutSpecial',
                        template: require('../trip-plan/about-special.html'),
                        scope: $scope,
                        buttons: [
                            {
                                text: '返回',
                                type: 'button-positive'
                            }
                        ]
                    })
                }
            }
        }
    })
    .directive('taStatusBar', function(){
        return {
            restrict: 'AE',
            template: require('./ta-status-bar.html'),
            replace: true,
            transclude: false,
            scope: {
                tripApprove: '=approve',
            },
            controller: function($scope) {
                $scope.EApproveStatus = QMEApproveStatus;
                $scope.APPROVE_TEXT = EApproveStatus2Text;
            }
        }
    })
    .directive('taHeader', function(){
        return {
            restrict: 'AE',
            template: require('./ta-header.html'),
            repalce: true,
            transclude: false,
            scope: {
                tripApprove: '=approve'
            },
            controller: function($scope){

            }
        }
    })
    .directive('taDetailItem', function() {
        return {
            restrict: 'AE',
            template: require('./ta-detail-item.html'),
            scope: {
                title: '@',
                budget: '@',
                item: '=',
                remark: '@'
            },
            controller: function($scope) {
                require('./trip-approve.scss');
                $scope.EInvoiceType = EInvoiceType;
                $scope.ETripType = ETripType;
                $scope.MTxPlaneLevel = MTxPlaneLevel;
                $scope.days = moment($scope.item.endTime).diff(moment($scope.item.startTime), 'days');

                $scope.subsidyDays = moment($scope.item.endDate).diff(moment($scope.item.fromDate), 'days')+1;
                if (!$scope.item.hasFirstDaySubsidy) {
                    $scope.subsidyDays = $scope.subsidyDays - 1;
                }
                if (!$scope.item.hasLastDaySubsidy) {
                    $scope.subsidyDays = $scope.subsidyDays - 1;
                }
            }
        }
    })