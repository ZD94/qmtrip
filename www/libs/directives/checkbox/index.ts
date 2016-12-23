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
            replace: true,
            scope: {
                model: '=ngModel',
                option: '=checkOption', //这种写法option传过来的是单独的一个对象
            },
            controller: function($scope, $element){
                require('./checkbox.scss');
                $scope.checkOption = function(option){
                    let values = _.cloneDeep($scope.model);
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
            controller: function($scope){
                $scope.$watch('model.length',function(n,o){
                    if(!$scope.model){
                        $scope.model = [];
                    }
                    var newlist = {};
                    for(let mod of $scope.model){
                        newlist[mod] = 3;
                    }
                    for(let option of $scope.options){
                        if(!newlist[option.value]){
                            $scope.selectAll = false;
                            return false;
                        }
                        $scope.selectAll = true;
                    }
                })
                $scope.checkall = function(){
                    if($scope.model.length == $scope.options.length){
                        $scope.model = []
                    }else{
                        $scope.options.map(function(opt){
                            if($scope.model.indexOf(opt.value) < 0){
                                $scope.model = _.clone($scope.model);
                                $scope.model.push(opt.value);
                                $scope.model.sort();
                            }
                        })
                    }
                }
            }
        }
    })