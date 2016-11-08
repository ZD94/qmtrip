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
            transclude: true,
            replace: true,
            scope:{
                bottomStyle:'=',
                rightClick:'&',
                leftClick:'&',
                staffSelector:'=',
                trip:'=',
                approveId:'=',
            },
            controller:function($scope) {

            }
        }
    })