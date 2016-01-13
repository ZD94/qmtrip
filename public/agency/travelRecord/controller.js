/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelRecord=(function(){

    API.require('agencyTripPlan');
    API.require('tripPlan');
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
        $scope.initTravelList = function () {
            $(".left_nav li").removeClass("on").eq(0).addClass("on");
            API.onload(function () {
                API.agencyTripPlan.pageTripPlanOrder({page:$scope.page})
                    .then(function(result){
                        console.info (result);
                        $scope.total = result.total;
                        var travelList = result.items;
                        travelList.map(function(company){
                            Q.all([
                                API.staff.getStaffByAgency({id:company.accountId}),
                                API.company.getCompanyById(company.companyId)
                            ])
                                .spread(function(ret1,ret2){
                                    company.travelerName = ret1;
                                    company.companyName = ret2;
                                    $scope.travelListitems = travelList;
                                    $scope.$apply();
                                    loading(true);
                                })
                                .catch(function(err) {
                                    console.info(err);
                                });
                        });
                    })
                    .catch(function(err) {
                        console.info(err);
                    });
            })
        }
        $scope.initTravelList();

        //进入详情页
        $scope.enterDetail = function (orderId) {
            window.location.href = "#/travelRecord/TravelDetail?orderId=" + orderId;
        }

        //分页
        $scope.pagination = function () {
            if ($scope.total) {
                $.jqPaginator('#pagination', {
                    totalCounts: $scope.total,
                    pageSize: 10,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page = num;
                        $scope.initTravelList();
                    }
                });
                clearInterval (pagenum);
            }
        }
        var pagenum =setInterval($scope.pagination,10);
    }




    /*
     出差单详细
     * @param $scope
     * @constructor
     */
    travelRecord.TravelDetailController = function($scope, $routeParams, $location, $anchorScroll) {
        loading(true);
        $("title").html("出差单明细");
        var orderId = $routeParams.orderId;
        $scope.initTravelDetail = function () {
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
        $scope.initTravelDetail();
        $scope.outTraffichref = function () {
            loading(true);
            $location.hash('outTraffic');
            $anchorScroll();

        }
        $scope.hotelhref = function () {
            loading(true);
            $location.hash('hotel');
            $anchorScroll();

        }
        $scope.backTraffichref = function () {
            loading(true);
            $location.hash('backTraffic');
            $anchorScroll();

        }


        //审核通过
        $scope.invoicePassShow = function (status) {
            if (status=='outTraffic') {
                $scope.consumeId = $scope.outTraffic.id;
            }
            else if (status=='hotel') {
                $scope.consumeId = $scope.hotel.id;
            }
            else if (status=='backTraffic') {
                $scope.consumeId = $scope.backTraffic.id;
            }
            $('.error').empty();
            $(".expenditure").val("");
            $(".invoicePass").show();
        }
        $scope.invoicePass = function () {
            var reg = /[^0-9]/;
            $scope.expenditure = $(".expenditure").val();
            $('.error').empty();
            if ($scope.expenditure=='') {
                $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>实际支出不能为空");
                return false;
            }
            if (reg.test($scope.expenditure)) {
                $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>实际支出不能为非数字");
                return false;
            }
            API.onload(function() {
                API.agencyTripPlan.approveInvoice({
                    userId:$scope.planDetail.accountId,
                    consumeId:$scope.consumeId,
                    expenditure:$scope.expenditure,
                    status:1
                })
                    .then(function(result){
                        $(".success").show();
                        $(".success_text").html('票据审核通过，实际支出为¥'+$scope.expenditure);
                        $scope.initTravelDetail();
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }
        //审核未通过
        $scope.invoiceNopassShow = function (status) {
            if (status=='outTraffic') {
                $scope.consumeId = $scope.outTraffic.id;
            }
            else if (status=='hotel') {
                $scope.consumeId = $scope.hotel.id;
            }
            else if (status=='backTraffic') {
                $scope.consumeId = $scope.backTraffic.id;
            }
            $('.error').empty();
            $(".expenditure").val("");
            $(".invoiceNoPass").show();
        }
        $scope.invoiceNoPass = function () {
            $scope.remark = $(".remark").val();
            $('.error').empty();
            if ($scope.remark=='') {
                $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>理由不能为空");
                return false;
            }
            API.onload(function() {
                API.agencyTripPlan.approveInvoice({
                    userId:$scope.planDetail.accountId,
                    consumeId:$scope.consumeId,
                    remark:$scope.remark,
                    status:-1
                })
                    .then(function(result){
                        $(".invoicePass,.invoiceNoPass").hide();
                        $scope.initTravelDetail();
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }
        //关闭弹窗
        $scope.invoiceColse = function () {
            $(".invoicePass,.invoiceNoPass").hide();
            $(".success").hide();
        }
    }



    return travelRecord;
})();

module.exports = travelRecord;