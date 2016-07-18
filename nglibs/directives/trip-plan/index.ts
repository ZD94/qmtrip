/**
 * Created by wlh on 16/7/18.
 */

'use strict';

import angular = require("angular");
import {EPlanStatus} from 'api/_types/tripPlan';

require("./trip-plan.scss");

angular
    .module("nglibs")
    .directive("tripPlan", [function() {
        return {
            restrict: 'AE',
            template: require('./template.html'),
            transclude: true,
            scope: {
                data:'=data',
                showHeader: '@showHeader',  //是否显示提交人信息
                showDetailStatus: '@showDetailStatus',  //是否显示详细状态,如果为false,则只显示[审批通过,审批未通过,待审批]
                click: '=click'
            },
            controller: function($scope) {
                $scope.trip = $scope.data;
                $scope.EPlanStatus = EPlanStatus;
                $scope.showHeader = Boolean($scope.showHeader);
                $scope.showDetailStatus = Boolean($scope.showDetailStatus);
                $scope.click = $scope.click || function(trip) { console.info('click me...');}
            }
        }
    }
    ]);
