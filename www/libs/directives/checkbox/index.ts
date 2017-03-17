/**
 * Created by seven on 2016/12/12.
 */
import angular = require('angular');
import _ = require('lodash');

angular
    .module('nglibs')
    .directive('checkBox',function () {
        return{
            restrict: 'AE',
            template: require('./checkbox.html'),
            replace: true,
            scope:{
                model:'=ngModel',
                options: '=ngCheckOptions', //这种写法options传过来是一个array
            },
            controller: function($scope,$element){
                require('./checkbox.scss');
                $scope.checkOption = function(option){
                    if (!$scope.model) {
                        $scope.model = [];
                    }
                    let idx = $scope.model.indexOf(option.value);
                    if(idx >=0){
                        $scope.model.splice(idx, 1);
                    }else{
                        $scope.model.push(option.value);
                    }
                }

            }
        }
    })
    .directive('singleCheck',function(){
        return{
            restrict: 'AE',
            template: require( './single-check.html'),
            // replace: true,
            scope: {
                model: '=ngModel',
                option: '=checkOption', //这种写法option传过来的是单独的一个对象
            },
            transclude: {
                'selected':'?selected',
                'notSelected':'?notSelected'
            },
            controller: function($scope, $element){
                require('./checkbox.scss');
                $scope.checkOption = function(option){
                    // let values = _.cloneDeep($scope.model) || [];
                    // ?????为什么我之前要加clone？？？现在导致model全选内存地址引用不同，无法通信，，奇怪，奇怪
                    let values = $scope.model;
                    let idx = values.indexOf(option.value);
                    if(idx >=0){
                        values.splice(idx, 1);
                    }else{
                        values.push(option.value);
                        // $scope.model = _.clone($scope.model).push(option.value);
                        values.sort();
                    }
                    $scope.model = values;
                }
            }
        }
    })
    .directive('allChecked',function(){
        return{
            restrict: 'AE',
            template: require('./all-checked.html'),
            scope:{
                model:'=ngModel',
                options: '=ngCheckOptions'
            },
            replace: true,
            transclude: {
                'all': '?all',
                'notAll': '?notAll'
            },
            controller: function($scope){
                $scope.$watch('model.length',function(n,o){
                    if(!$scope.model){
                        $scope.selectAll = false;
                        return;
                    }
                    let allValues = $scope.options.map((opt)=>opt.value);
                    $scope.selectAll = isAllChecked($scope.model, allValues);
                })
                $scope.checkall = function(){
                    if($scope.model && $scope.model.length == $scope.options.length){
                        $scope.model = []
                    }else{
                        $scope.model = Array.from($scope.options.map( (item)=> item.value));
                        $scope.model.sort();
                    }
                }
            }
        }
    });


function isAllChecked(values, allValues){
    var valueMap = {};
    for(let mod of values){
        valueMap[mod] = true;
    }
    for(let v of allValues){
        if(!valueMap[v]){
            return false;
        }
    }
    return true;
}
