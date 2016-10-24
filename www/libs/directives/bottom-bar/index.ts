/**
 * Created by shiCong on 16/10/21.
 */

"use strict";

import angular = require("angular");

angular
    .module("nglibs")
    .directive("bottomBar",function(){
        return{
            restrict: 'AE',
            template: require('./bottom-bar.html'),
            scope:{
                bottomStyle:'=',
                rightClick:'&',
                leftClick:'&',
                staffSelector:'=',
                trip:'=',
                approveId:'=',
            },
            controller:function($scope) {
                require('./bottom-bar.scss');
                $scope.approveDetail = function(){
                    let approveId = $scope.approveId;
                    window.location.href = `#/trip-approval/approve-progress?approveId=${approveId}`
                }
            }
        }
    })