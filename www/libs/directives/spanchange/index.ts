/**
 * Created by shiCong on 16/9/21.
 */

"use strict";

import angular = require("angular");
import moment = require("moment");

angular
    .module("nglibs")
    .directive("spanchange",function(){
        return {
            restrict: 'AE',
            template: require('./span.html'),
            scope:{
                span:'=ngModel'
            },
            controller:function($scope, $ionicModal, ngModalDlg, $stateParams) {
                require('./spanchange.scss');
                let span = $scope.span;
                $scope.interval = calculateInterval(span);
                $scope.monthChange = function (x: number) {
                    $scope.span.startTime = moment($scope.span.startTime).add(x, $scope.interval).toDate();
                    $scope.span.endTime = moment($scope.span.endTime).add(x, $scope.interval).toDate();
                    console.log('change', $scope.span);
                };
                $scope.showmadel = async function () {
                    let ret = await ngModalDlg.createDialog({
                        parent: $scope,
                        scope: {span, interval: $scope.interval},
                        template: require('./spanchange.html'),
                        controller: SpanChangeController,
                    });
                    $scope.span = ret.span;
                    $scope.interval = ret.interval;
                }
            }
        }
    });

function calculateInterval(span:{startTime:Date, endTime:Date}){
    let end = moment(span.endTime);
    if(moment(span.startTime).add(1, 'years').isSame(end))
        return 'years';
    if(moment(span.startTime).add(1, 'quarters').isSame(end))
        return 'quarters';
    if(moment(span.startTime).add(1, 'months').isSame(end))
        return 'months';
    if(moment(span.startTime).add(1, 'weeks').isSame(end))
        return 'weeks';
    return 'other';
}

const intervals = {
    weeks:'周',
    months:'月',
    quarters:'季',
    years:'年',
};
function SpanChangeController($scope, ngModalDlg){
    $scope.intervals = intervals;
    $scope.$watch('interval', function(n, o){
        if(n != o){
            if(n !== 'other'){
                let start = moment($scope.span.startTime).startOf($scope.interval);
                $scope.span.startTime = start.toDate();
                $scope.span.endTime = start.add(1, $scope.interval).toDate();
            }
        }
    })

    $scope.selfDefineFun = async function(){
        let value = {
            begin: $scope.span.startTime,
            end: $scope.span.endTime
        }
        value = await ngModalDlg.selectDateSpan($scope, {
            beginDate:value.begin,
            endDate: value.end,
            timepicker: false,
            title: '选择开始时间',
            titleEnd: '选择结束时间',
            fromStatistic: true
        }, value);
        $scope.span.startTime = value.begin;
        $scope.span.endTime = value.end;
    };
    console.log('指令t', $scope.span);
}
