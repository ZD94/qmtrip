/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelRecord=(function(){

    API.require('agencyTripPlan');
    API.require("staff");
    API.require("company");


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
            $(".left_nav li").removeClass("on").eq(0).addClass("on");
            API.onload(function () {
                API.agencyTripPlan.listAllTripPlanOrder()
                    .then(function(result){
                        console.log(API.staff);
                        console.info(result);
                        result.map(function(company){
                            Q.all([
                                API.staff.getStaffByAgency({id:company.accountId}),
                                API.company.getCompany(company.companyId)
                            ])
                                .spread(function(ret1,ret2){
                                    company.travelerName = ret1;
                                    company.companyName = ret2;
                                    $scope.travelListitems = result;
                                    $scope.$apply();
                                    loading(true);
                                })
                                .catch(function(err) {
                                    console.info(err);
                                    return company;
                                });
                        });
                    })
            })
        }
        $scope.initPlanList();

        //进入详情页
        $scope.enterDetail = function (orderId) {
            window.location.href = "#/travelRecord/TravelDetail?orderId=" + orderId;
        }
    }




    /*
     出差单详细
     * @param $scope
     * @constructor
     */
    travelRecord.TravelDetailController = function($scope, $routeParams) {
        loading(true);
        $("title").html("出差单明细");
        var orderId = $routeParams.orderId;
        API.onload(function() {
            API.agencyTripPlan.getTripPlanOrderById(orderId)
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



    return travelRecord;
})();

module.exports = travelRecord;