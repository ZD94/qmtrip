/**
 * Created by seven on 16/6/6.
 */
"use strict";

// import angular = require('angular');

angular
    .module('nglibs')
    .directive('statisticalBar', function() {
        require('./statistical.less');
        return {
            restrict:'A',
            replace:true,
            transclude: true,
            scope: {
                options : '='
            },
            template:'<div class="jl_statis"><span ng-transclude></span> <div class="statis"><div class="statisBar" style="background: {{color}};width: {{percent}};"></div></div>{{price}}元</div>',
            controller:function ($scope) {
                var options = $scope.options;
                // var options = $element.attr('jl-options');
                var all = options.all;
                var current = options.current;
                $scope.percent = (current/all)*100+'%';
                $scope.price = current;
                if(options.color){
                    $scope.color = options.color;
                }else{
                    $scope.color = 'red';
                }

            }
        }
    })