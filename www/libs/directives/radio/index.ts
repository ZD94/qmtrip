
import angular = require('angular');

angular
    .module('nglibs')
    .directive('newRadio',function(){
        return {
            restrict: 'AE',
            template: require('./new-radio.html'),
            replace: true,
            scope:{
                model: '=ngModel',
                options: '=ngCheckOptions'
            },
            controller: function($scope){
                require('./radio.scss');
                $scope.chooseOne = function(options){
                    $scope.model = options.value;
                }
            }
        }
    })