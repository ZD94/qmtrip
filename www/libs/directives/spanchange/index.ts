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
            controller:function($scope, $ionicModal, ngModalDlg){
                require('./spanchange.scss');

                let formatStr = 'YYYY-MM-DD HH:mm:ss';

                let monthSelection = getSpanSelection('month');
                $scope.monthSelection = monthSelection;





                async function searchData() {
                    let month = $scope.monthSelection;
                    let startTime = moment(month.startTime).format(formatStr);
                    let endTime = moment(month.endTime).format(formatStr);
                    let statistic = await API.tripPlan.statisticTripBudget({startTime: startTime, endTime: endTime});
                    $scope.statistic = statistic;
                    $scope.saveMoneyChart.data = [statistic.savedMoney || 0, statistic.expenditure || 1];
                }
                //新添加的----------------------------------------------shicong
                //摸态框的调用
                $scope.showmadel = function(){
                    $scope.modal.show();
                }
                $scope.modal = $ionicModal.fromTemplate(require('./spanchange.html'), {
                    scope: $scope,
                    animation: 'slide-in-up'
                })

                //更改时间间隔
                var span_depend = 'month';
                let lastClick = 'month';
                $scope.isweek = false;
                $scope.ismonth = true;
                $scope.isquarter = false;
                $scope.isyear = false;
                $scope.changespan = async function(span){
                    if(lastClick){
                        let last = 'is' + lastClick;
                        $scope[last] = false;
                    }
                    let nowClick = 'is' + span;
                    $scope[nowClick] = true;

                    let spanSelection = getSpanSelection(span);
                    span_depend = span;
                    $scope.monthSelection = spanSelection;
                    lastClick = span;
                    $scope.modal.hide();
                    await searchData();
                }
                //改写monthChange函数 改变时间

                $scope.monthChange = async function(isAdd?: boolean) {
                    let optionFun = isAdd ? 'add' : 'subtract';
                    let querySpan = moment( $scope.monthSelection.month)[optionFun](1, span_depend);
                    $scope.monthSelection = getSpanSelection(span_depend,querySpan);

                    await searchData();
                };
                function getSpanSelection(span_depend,querySpan = moment()){
                    let spanSelections = {
                        month: querySpan.format('YYYY-MM-DD'),
                        startTime: querySpan.startOf(span_depend).toDate(),
                        endTime: querySpan.endOf(span_depend).toDate()
                    }
                    return spanSelections;
                }
                //自定义选择日期
                $scope.selfdefine = false;

                $scope.selfDefineFun = async function(){
                    let value = {
                        begin:moment().startOf('month').subtract(12,'month').toDate(),
                        end:moment().endOf('month').toDate()
                    }
                    value = await ngModalDlg.selectDateSpan($scope, {
                        beginDate:value.begin,
                        endDate: value.end,
                        timepicker: false,
                        title: '选择开始时间',
                        titleEnd: '选择结束时间',
                        fromStatistic: true
                    }, value);
                    let selfSelection = {
                        month: moment().format('YYYY-MM'),
                        startTime: moment(value.begin).toDate(),
                        endTime: moment(value.end).toDate()
                    };
                    $scope.monthSelection = selfSelection;
                    $scope.modal.hide();
                    await searchData();
                }

            }
        }
    })