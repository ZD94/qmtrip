/**
 * Created by qp on 2016/4/9.
 */
"use strict";

module.exports = function ($module){
    $module.directive("ngCitypicker",function(){
        return {
            restrict: 'A',
            replace: true,
            scope: {
                ngModel: "="
            },
            template: require('../../mobile/test/citytemplate.html'),
            controller: function($scope, $element, $transclude) {
                var back = $element.find(".city_style_black_back");
                var city = $element.find(".city_style");
                var choose = $element.find("#city-picker");
                console.info($scope);
                //$scope.choose_city = ;
                $scope.show_city = function() {
                    choose.attr('value',$scope.ngModel[0] + ' ' + $scope.ngModel[1] + ' ' + $scope.ngModel[2]);
                    console.info($scope.ngModel);
                    //choose.attr('value',ngModel);
                    back.show();
                    city.show();
                    console.info($scope.ngModel);
                }
                $scope.cancel_city = function() {
                    back.hide();
                    city.hide();
                }
                $scope.sure_city = function() {
                    back.hide();
                    city.hide();
                    $scope.choose_city = $scope.ngModel[0] + ' ' + $scope.ngModel[1] + ' ' + $scope.ngModel[2];
                    console.info('click sure====', $scope.ngModel);
                }
            },
            compile:function(element,attrs,$transclude){

            }
        }
    });
}