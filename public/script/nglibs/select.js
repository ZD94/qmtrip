"use strict";

module.exports = function ($module){
    $module.directive('ngSelect',function(){
        return {
            priority: 1001,
            restrict: 'A',
            template: '<dl><div ng-transclude></div>'
                    + '<dt ng-click="show_options()">{{optionmap[optionval]}}</dt>'
                    + '<dd ng-repeat="(val, text) in optionmap" checkvalue="{{val}}" ng-click="select_option($event)" style="display: none;">'
                    + '{{text}}'
                    + '</dd>'
                    + '</dl>',
            replace: true,
            transclude: 'element',
            scope: {
                ngModel: '='
            },
            controller: function($scope, $element){
                $scope.optionmap = {};
                $scope.optionval = '';
                $scope.show_options = function($event) {
                    $element.find('dd').toggle();
                };
                $scope.select_option = function($event){
                    $element.find('dd').hide();
                    $scope.optionval = $($event.target).attr('checkvalue');
                    var select = $element.find("select");
                    select.val($scope.optionval);
                    process.nextTick(function(){
                        select.trigger('change');
                    });
                };
                $scope.$watch('ngModel', function(){
                    process.nextTick(function(){
                        $scope.optionval = $element.find("select").val();
                        $scope.$apply();
                    });
                })
            },
            compile: function(element, attr, trans){
                element.removeAttr("ng-options");
                element.removeAttr("ng-model");
                return function (scope, element, attr, controller, transcludeFn) {
                    element.find("select").css('display', 'none');
                    element.find("option").each(function (index, option) {
                        scope.optionmap[option.value] = option.innerHTML;
                    });
                }
            }
        }
    });
};

