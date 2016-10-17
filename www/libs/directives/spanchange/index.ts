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
            controller:function($scope, $ionicModal, ngModalDlg) {
                require('./spanchange.scss');
                let span = $scope.span;
                $scope.spacing = {
                    interval:''
                };
                $scope.spacing.interval = calculateInterval(span);
                $scope.monthChange = function (x: number) {
                    $scope.span.startTime = moment($scope.span.startTime).add(x, $scope.spacing.interval).toDate();
                    $scope.span.endTime = moment($scope.span.endTime).add(x, $scope.spacing.interval).toDate();
                };
                $scope.showmadel = async function () {
                    let ret = await ngModalDlg.createDialog({
                        parent: $scope,
                        scope: {span, interval: $scope.spacing.interval},
                        template: require('./spanchange.html'),
                        controller: SpanChangeController,
                    });
                    //$scope.span = ret.span;
                    //$scope.interval = ret.interval;
                }
            }
        }
    });

function calculateInterval(span:{startTime:Date, endTime:Date}){
    let end = moment(span.endTime);
    if(moment(span.startTime).add(1, 'years').subtract(1, 'days').isSame(end))
        return 'years';
    if(moment(span.startTime).add(1, 'quarters').subtract(1, 'days').isSame(end))
        return 'quarters';
    if(moment(span.startTime).add(1, 'months').subtract(1, 'days').isSame(end))
        return 'months';
    if(moment(span.startTime).add(1, 'weeks').subtract(1, 'days').isSame(end))
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
    $scope.$watch('spacing.interval', function(o, n){
        if(n != o){
            if(n !== 'other'){
                let start = moment($scope.span.startTime).startOf($scope.spacing.interval);
                $scope.span.startTime = start.toDate();
                $scope.span.endTime = start.add(1, $scope.spacing.interval).subtract(1, 'days').toDate();
            }
        }
    })
    $scope.changeSpan = function(key,modal){
        $scope.spacing.interval = key;
        modal.hide();
    }
    $scope.selfDefineFun = async function(modal){
        let value = {
            begin: moment().add(-1,'years').startOf('months').toDate(),
            end: moment().endOf('months').toDate()
        }
        value = await ngModalDlg.selectDateSpan($scope, {
            beginDate:moment().add(-1,'years').startOf('months').toDate(),
            endDate: moment().endOf('months').toDate(),
            timepicker: false,
            title: '选择开始时间',
            titleEnd: '选择结束时间',
            fromStatistic: true
        }, value);
        $scope.span.startTime = value.begin;
        $scope.span.endTime = value.end;
        modal.hide();
    };
}
