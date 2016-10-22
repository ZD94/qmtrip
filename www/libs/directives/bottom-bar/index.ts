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
                leftClick:'&'
            },
            controller:function($scope) {
                require('./bottom-bar.scss');
            }
        }
    })