import angular = require('angular');
import {selectCityListController} from "./city-list";

angular
    .module('nglibs')
    .directive('ngSelectorCity', function(){
        return{
            restrict: 'E',
            template: require('./city.html'),
            scope: {
                value: '=ngModel',
                noticeMsg: '@dlgNoticeMsg',
                title: '@dlgTitle',
                placeholder: '@dlgPlaceholder',
                opts: '=dlgOptions'
            },
            controller: function($scope, ngModalDlg) {
                $scope.displayItem = function(item) {
                    if(item && $scope.opts && $scope.opts.display) {
                        return $scope.opts.display(item, false);
                    }
                    return item;
                };
                $scope.showSelectorDlg = async function() {
                    $scope.opts.title = $scope.title;
                    $scope.opts.placeholder = $scope.placeholder;
                    $scope.opts.noticeMsg = $scope.noticeMsg;
                    let val = $scope.value;
                    let options = $scope.opts;
                    let value = await ngModalDlg.selectCity($scope,options,val);
                    // var value: any = await ngModalDlg.selectCityList($scope, $scope.opts, $scope.value)
                    if(value == undefined)
                        return;
                    $scope.value = value;

                    if($scope.opts.done && typeof $scope.opts.done == 'function') {
                        return $scope.opts.done(value);
                    }
                };
            }
        }
    })