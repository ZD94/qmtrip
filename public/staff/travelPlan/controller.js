/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelPlan=(function(){

    API.require('tripPlan');

    var  travelPlan = {};

    /*
        出差单列表
     * @param $scope
     * @constructor
     */
    travelPlan.PlanListController = function($scope) {
        loading(true);
        $("title").html("出差单列表");
        //待上传票据列表
        $scope.initPlanList = function () {
            var params = {auditStatus: [-1, 0]};
            if ($scope.keyword !='' && $scope.keyword !=undefined) {
                params.$like = ['startPlace', '%' + $scope.keyword + '%'];
            }
            console.info (params);
            API.onload(function() {
                API.tripPlan.listTripPlanOrder(params)
                    .then(function(result){
                        $scope.planListitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
            })
        }
        //已完成列表
        $scope.initFinishPlanList = function () {
            API.onload(function() {
                API.tripPlan.listTripPlanOrder({auditStatus: [1]})
                    .then(function(result){
                        $scope.finishPlanListitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
            })
        }
        $scope.initPlanList();
        $scope.initFinishPlanList();

        //进入详情页
        $scope.enterDetail = function (id) {
            window.location.href = "#/travelPlan/PlanDetail?planId="+id;
        }

        //未完成关键字模糊查询
        $scope.searchKeyword = function () {
            $scope.initPlanList();
        }

        //删除
        $scope.deletePlan = function () {
            API.onload(function() {
                console.info(1111111111);
                API.tripPlan.deleteTripPlanOrder('d3a389b0-ae13-11e5-b799-3fa6e9e1404b')
                    .then(function(result){
                        Myalert("温馨提示","删除成功");
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info(err);
                    });
            })
        }

        //未完成已完成选项卡
        $('.mainbox_top li').click(function(){
            var i = $(this).index();
            $('.mainbox_top li').removeClass('active');
            $(this).addClass('active');
            $('.mainbox_bottom').hide();
            $('.mainbox_bottom').eq(i).show();
        })
    }



    /*
     出差单详细
     * @param $scope
     * @constructor
     */
    travelPlan.PlanDetailController = function($scope, $routeParams) {
        loading(true);
        $("title").html("出差单明细");
        var planId = $routeParams.planId;
        API.onload(function() {
            API.tripPlan.getTripPlanOrderById(planId)
                .then(function(result){
                    $scope.planDetail = result;
                    $scope.backTraffic = $scope.planDetail.backTraffic[0];
                    $scope.hotel = $scope.planDetail.hotel[0];
                    $scope.outTraffic = $scope.planDetail.outTraffic[0];
                    console.info (result);
                    $scope.$apply();
                })
        })

    }



    return travelPlan;
})();

module.exports = travelPlan;