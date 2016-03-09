/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelplan=(function(){

    API.require('tripPlan');
    API.require("auth");
    API.require("attachment");

    var  travelplan = {};

    /*
        出差单列表
     * @param $scope
     * @constructor
     */
    travelplan.PlanlistController = function($scope) {
        $("title").html("出差记录");
        loading(true);
    }



    /*
     出差单详细
     * @param $scope
     * @constructor
     */
    travelplan.PlandetailController = function($scope, $routeParams) {
        $("title").html("出差记录");
        loading(true);
    }



    /*
     行程单详细
     * @param $scope
     * @constructor
     */
    travelplan.InvoicedetailController = function($scope, $routeParams) {
        loading(true);
        $("title").html("票据详情");
        var planId = $routeParams.planId;
        $scope.planId = planId;
        $scope.status = $routeParams.status;
        $scope.invoiceId = $routeParams.invoiceId;
        API.require("attachment");
        API.onload(function() {
            API.tripPlan.getTripPlanOrderById(planId)
            .then(function(result){
                var InvoiceDetail;
                $scope.planDetail = result;

                if ($scope.status=='outTraffic') {
                    InvoiceDetail = result.outTraffic[0];
                }
                if ($scope.status=='backTraffic') {
                    InvoiceDetail = result.backTraffic[0];
                }
                if ($scope.status=='hotel') {
                    InvoiceDetail = result.hotel[0];
                }
                return InvoiceDetail;
            })
            .then(function(invoiceDetail) {
                $scope.InvoiceDetail = invoiceDetail;
                return  API.attachment.previewSelfImg({fileId: invoiceDetail.newInvoice})
                .then(function(invoiceImg) {
                    $scope.invoiceImg = invoiceImg;
                    $scope.$apply();
                })
            })
            .catch(function(err){
                TLDAlert(err.msg || err);
            })
        })
        $scope.goDetail = function () {
            window.location.href = "#/travelPlan/PlanDetail?planId="+planId;
        }
    }





    return travelplan;
})();

module.exports = travelplan;