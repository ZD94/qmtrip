import angular = require('angular');

angular
    .module('nglibs')
    .directive('listRepeat',function () {
        return {
            restrict: 'E',
            template: `<ion-item
                        class="item-icon-right"
                        ng-repeat="$item in list track by $index"
                        ng-if="displayItem(option) != displayItem(value)"
                        ng-click="confirm(option)"
                        ng-class="{'item-stable':disableItem(option)}"
                        >
                        <ng-transclude></ng-transclude>
                        <span ng-bind-html="displayItem(option)"></span>
                        <span class="item-note" ng-if="options.note" ng-bind-html="options.note(option)"></span>
                        </ion-item>`,
            transclude:true,
            scope: {
                'arg': '='
            },
            controller: function ($scope) {
                $scope.list = $scope.arg.query();

            },
        }
    });