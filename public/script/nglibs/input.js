/**
 * Created by qp on 2016/3/28.
 */
"use strict";


module.exports = function ($module){
    $module.directive("login",function(){
        return {
            restrict: 'A',
            replace: true,
            template: '<div>' + '<input class="input" type="text" placeholder required/>' + '<span class="clear_input web-icon-font" ng-click="clear_val($event)">&#xf057;</span>' + '</div>',
            controller: function($scope) {
                $scope.clear_val = function($event) {
                    $($event.target).siblings('input').val('');
                    $('#login').attr('disabled', true).removeClass('blue_bc');
                }
            },
            link:function(scope,element){
                var input = element.find('input');
                input.attr("placeholder",element.attr("placeholder"));
                element.removeAttr("placeholder");
            }
        }
    });
}