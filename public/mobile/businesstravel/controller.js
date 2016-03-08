/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var businesstravel=(function(){

    API.require("auth");
    API.require("place");
    API.require("travelPolicy");
    API.require("tripPlan");
    API.require("travelBudget");

    var  businesstravel = {};

    /*
        我要出差首页
     * @param $scope
     * @constructor
     */
    businesstravel.IndexController = function($scope) {
        $("title").html("我要出差");
        loading(true);


        $scope.selectCity = function () {
            API.onload(function() {
                API.place.hotCities({})
                    .then(function(result){
                        selectPage('#selectPurpose',result,{
                            isAllowAdd: false,
                            showDefault: true,
                            title: '最新项目',
                            placeholder: '输入项目具体名称',
                            limit: 10
                        });
                        console.info (selectPage);
                    })
                    .catch(function(err){
                        console.info (err);
                    })
            })
        }

        $scope.nextStep = function () {
            alert ($('#selectPurpose').html());
        }
    }

    /*
     我要出差选择交通
     * @param $scope
     * @constructor
     */
    businesstravel.TrafficliveController = function($scope) {
        $("title").html("我要出差");
        loading(true);
        $scope.dateChooese = function($event){
            var thismonth = moment().startOf('month').format('M');
            mobileSelectDate({
                isShowMonth: true
            }, {
                month: thismonth,
                year: 2016,
                displayMonthNum: 12
            })
                .then(function(selectedDate) {
                    //alert("您选择的日期是:"+selectedDate);
                    $($event.target).html(selectedDate);
                })
                .catch(function(err) {
                    console.error(err);
                })
        }
    }

    /*
     我要出差动态预算结果
     * @param $scope
     * @constructor
     */
    businesstravel.CreateresultController = function($scope) {
        $("title").html("动态预算结果");
        loading(true);
    }

    return businesstravel;
})();

module.exports = businesstravel;