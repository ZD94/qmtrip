/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelRecord=(function(){

    API.require('agencyTripPlan');

    var  travelRecord = {};

    /*
        出差单列表
     * @param $scope
     * @constructor
     */
    travelRecord.TravelListController = function($scope) {
        loading(true);
        $("title").html("出差单列表");
        //待上传票据列表
        $scope.initPlanList = function () {
            API.onload(function () {
                API.agencyTripPlan.listTripPlanOrder({})
                    .then(function (result) {
                        $scope.travelListitems = result;
                        console.info(result);
                        $scope.$apply();
                    })
            })
        }
        $scope.initPlanList();

        //进入详情页
        $scope.enterDetail = function (id) {
            window.location.href = "#/travelPlan/PlanDetail?planId=" + id;
        }
    }




    /*
     出差单详细
     * @param $scope
     * @constructor
     */
    //travelPlan.PlanDetailController = function($scope, $routeParams) {
    //    loading(true);
    //    $("title").html("出差单明细");
    //    var planId = $routeParams.planId;
    //    API.onload(function() {
    //        API.tripPlan.getTripPlanOrderById(planId)
    //            .then(function(result){
    //                $scope.planDetail = result;
    //                $scope.backTraffic = $scope.planDetail.backTraffic[0];
    //                $scope.hotel = $scope.planDetail.hotel[0];
    //                $scope.outTraffic = $scope.planDetail.outTraffic[0];
    //                console.info (result);
    //                $scope.$apply();
    //            })
    //    })
    //}



    return travelRecord;
})();

module.exports = travelRecord;