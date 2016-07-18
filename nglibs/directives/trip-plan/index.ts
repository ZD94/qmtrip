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
                showHeader: '@showHeader',
                showDetailStatus: '@showDetailStatus',
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
