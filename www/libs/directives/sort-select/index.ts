/**
 * Created by seven on 2017/2/16.
 */
"use strict";

import angualr = require('angular');

angular
    .module('nglibs')
    .directive('sortSelect', function(){
        return{
            restrict: 'AE',
            template: require('./select.html'),
            replace: true,
            transclude: true,
            scope:{
                select: '=select',
                selectList: '=selectList',
                doneCb: '&done'
            },
            controller: function($scope,sortDlg,$timeout){
                let shown = false;
                $scope.sortBy = async function($event){
                    if(shown){
                        shown = false;
                        $scope.$broadcast('$sortClose');
                        return;
                    }
                    shown = true;
                    let element = $($event.currentTarget);
                    let top = element.offset().top + element.height() + 5; //5为父元素padding-bottom值
                    let result = await sortDlg.createDialog({
                        parent: $scope,
                        scope:{
                            selected: $scope.select,
                            list: $scope.selectList,
                            top,
                        },
                        template: require('./select_template.html'),
                        controller: sortController
                    })
                    shown = false;
                    $scope.select = result;
                    $scope.doneCb()(result.value)
                }
                function sortController($scope,$element){
                    let selectLength = $scope.list.length;
                    $element.find('.list-item').css({'top':-selectLength*40});
                    //40为每条item高度，此时未渲染页面，所以无法获取，暂时手动控制
                    $timeout(function(){$element.find('.list-item').css({'top':0});},0);
                    $element.css({'top':$scope.top});
                }
            }
        }
    })