
require('./fake-input.scss');

angular
    .module('nglibs')
    .directive('fakeInput', function() {
        return {
            restrict: 'E',
            template: '<span><span>{{value}}</span><span class="placeholder-div" ng-if="!value || value===\'\'">{{placeholder}}</span></span>',
            scope:{
                value: '@',
                placeholder: '@'
            }
        }
    });
