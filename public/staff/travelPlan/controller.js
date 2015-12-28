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
        API.onload(function() {
            API.tripPlan.listTripPlanOrder({})
                .then(function(result){
                    $scope.planListitems = result;
                    console.info (result);
                    $scope.$apply();
                })
        })

        $scope.enterDetail = function (id) {
            window.location.href = "#/travelPlan/PlanDetail?planId="+id;
        }
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
                    console.info (result);
                    $scope.$apply();
                })
        })

    }



    return travelPlan;
})();

module.exports = travelPlan;