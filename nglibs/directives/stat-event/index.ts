/**
 * Created by chen on 2017/3/16.
 */
"use strict" ;

angular
    .module('nglibs')
    .directive("ngStatEvent",function(){
        return {
            restrict : 'A',
            scope :{
                //传入的参数直接使用
                statEvent : '@ngStatEvent',
            },
            controller : function($scope, $element, CNZZ){
                $element.click(function(){
                    let args = $scope.statEvent.split(',');
                    CNZZ.addEvent.apply(this, args);
                })
            }
        }
    });