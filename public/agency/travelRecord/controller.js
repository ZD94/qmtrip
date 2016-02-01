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
                API.agencyTripPlan.pageTripPlanOrder({page:$scope.page, perPage:20, isUpload: true, audit: 'P'})
                    .then(function(result){
                        console.info (result);
                        $scope.total = result.total;
                        $scope.pages = result.pages;
                        var travelList = result.items;
                        travelList.map(function(s){
                            Q.all([
                                API.staff.getStaffByAgency({id:s.accountId}),
                                API.company.getCompanyById(s.companyId)
                            ])
                                .spread(function(ret1,ret2){
                                    s.travelerName = ret1;
                                    s.companyName = ret2;
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
                    pageSize: 20,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        if ($scope.pages==1) {
                            $("#pagination").hide();
                        }
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
                        var outTraffic = result.outTraffic[0];
                        var backTraffic = result.backTraffic[0];
                        var hotel = result.hotel[0];


                        $scope.planDetail = result;
                        $scope.outTraffic = $scope.planDetail.outTraffic[0];
                        $scope.backTraffic = $scope.planDetail.backTraffic[0];
                        $scope.hotel = $scope.planDetail.hotel[0];
                        console.info("执行到A==>", hotel, backTraffic, outTraffic);

                        var outTraffics = $scope.planDetail.outTraffic;
                        var backTraffics = $scope.planDetail.backTraffic;
                        var hotels = $scope.planDetail.hotel;

                        if (hotel && hotel.newInvoice) {
                            $scope.hotelInvoiceImg = "/consume/invoice/" + hotel.id;
                            /*API.agencyTripPlan.getConsumeInvoiceImg({
                                consumeId: hotel.id
                            })
                            .then(function(hotelInvoiceImg) {
                                $scope.hotelInvoiceImg = hotelInvoiceImg;
                                $scope.$apply();
                            })
                            .catch(function(err) {
                                console.info(err);
                            })*/
                        }

                        if (backTraffic && backTraffic.newInvoice) {
                            $scope.backTrafficInvoiceImg = "/consume/invoice/" + backTraffic.id;
                            /*API.agencyTripPlan.getConsumeInvoiceImg({
                                    consumeId: backTraffic.id
                                })
                                .then(function(backTrafficInvoiceImg) {
                                    $scope.backTrafficInvoiceImg = backTrafficInvoiceImg;
                                    $scope.$apply();
                                })
                                .catch(function(err) {
                                    console.info(err);
                                })*/
                        }

                        if (outTraffic && outTraffic.newInvoice) {
                            $scope.outTrafficInvoiceImg = "/consume/invoice/" + outTraffic.id;
                            /*API.agencyTripPlan.getConsumeInvoiceImg({
                                    consumeId: outTraffic.id
                                })
                                .then(function(outTrafficInvoiceImg) {
                                    $scope.outTrafficInvoiceImg = outTrafficInvoiceImg;
                                    $scope.$apply();
                                })
                                .catch(function(err) {
                                    console.info(err);
                                })*/
                        }

                        outTraffics.map(function(outTraffic){
                            return Q.all([
                                API.agency.getAgencyUser(outTraffic.auditUser),
                                API.agencyTripPlan.getConsumeInvoiceImg({consumeId: outTraffic.id})
                            ])
                            .spread(function(auditName, invoiceImg) {
                                outTraffic.auditName = auditName;
                                outTraffic.invoiceImg = invoiceImg;
                                return outTraffic;
                            })
                            //
                            //API.agency.getAgencyUser(outTrafficauditUser.auditUser)
                            //    .then(function(result){
                            //        outTrafficauditUser.auditName = result;
                            //        $scope.$apply();
                            //        loading(true);
                            //    })
                            //    .catch(function(err) {
                            //        console.info(err);
                            //    });
                        });
                        backTraffics.map(function(backTraffic){
                            return Q.all([
                                    API.agency.getAgencyUser(backTraffic.auditUser),
                                    API.agencyTripPlan.getConsumeInvoiceImg({consumeId: backTraffic.id})
                                ])
                                .spread(function(auditName, invoiceImg) {
                                    backTraffic.auditName = auditName;
                                    backTraffic.invoiceImg = invoiceImg;
                                    return backTraffic;
                                })

                            //API.agency.getAgencyUser(backTrafficauditUser.auditUser)
                            //    .then(function(result){
                            //        backTrafficauditUser.auditName = result;
                            //        $scope.$apply();
                            //        loading(true);
                            //    })
                            //    .catch(function(err) {
                            //        console.info(err);
                            //    });
                        });

                        hotels = hotels.map(function(hotel){
                            return Q.all([
                                    API.agency.getAgencyUser(hotel.auditUser),
                                    API.agencyTripPlan.getConsumeInvoiceImg({consumeId: hotel.id})
                                ])
                                .spread(function(auditName, invoiceImg) {
                                    hotel.auditName = auditName;
                                    hotel.invoiceImg = invoiceImg;
                                    return hotel;
                                })
                            //API.agency.getAgencyUser(hotel.auditUser)
                            //    .then(function(result){
                            //        hotel.auditName = result;
                            //        $scope.$apply();
                            //        loading(true);
                            //    })
                            //    .catch(function(err) {
                            //        console.info(err);
                            //    });
                        });

                        Q.all(hotels)
                        .then(function(hotels) {
                            $scope.hotels = hotels;
                            $scope.$apply();
                        })
                        .catch(function(err) {
                            console.info(err);
                        })

                        Q.all(outTraffics)
                        .then(function(outTraffics) {
                            $scope.outTraffics = outTraffics;
                            $scope.$apply();
                        })
                        .catch(function(err) {
                            console.info(err);
                        })

                        Q.all(backTraffics)
                        .then(function(backTraffics) {
                            $scope.backTraffics = backTraffics;
                            $scope.$apply();
                        })
                        .catch(function(err) {
                            console.info(err);
                        })

                        API.staff.getStaffByAgency({id:$scope.planDetail.accountId})
                            .then(function(result){
                                $scope.travelerName = result.name;
                                $scope.$apply();
                            })
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
            var moneyReg = /^\d+(.\d{1,2})?$/;
            $scope.expenditure = $(".expenditure").val();
            $('.error').empty();
            if ($scope.expenditure=='') {
                $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>实际支出不能为空");
                return false;
            }
            if (!moneyReg.test($scope.expenditure)) {
                $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>实际支出格式不正确");
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


        var reason1 = "",
            reason2 = "";
        $scope.checkreason1 = function () {
            $(".reason1 i").toggleClass("check");
            reason1 = $(".reason1 .check").next().html();
        }
        $scope.checkreason2 = function () {
            $(".reason2 i").toggleClass("check");
            reason2 = $(".reason2 .check").next().html();
        }
        $scope.invoiceNoPass = function () {
            var reasontext = $(".invoiceNoPass .remark").val();
            $scope.remark = reason1 + " " + reason2 + " " + reasontext;
            $('.error').empty();
            if (reason1 =='' && reason2 == '' && reasontext == '') {
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
                        $(".reason1 i,.reason2 i").removeClass("check");
                        reason1 = '';
                        reason2 = '';
                        reasontext = '';
                        $scope.initTravelDetail();
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }


        //录入预算
        $scope.editBudgetShow = function (id) {
            $scope.editBudgetId = id;
            $('.error').empty();
            $(".budget").val("");
            $(".editBudget").show();
        }
        $scope.editBudget = function () {
            var budget = $(".editBudget .budget").val();
            var moneyReg = /^\d+(.\d{1,2})?$/;
            $('.error').empty();
            if (budget=='') {
                $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>预算不能为空");
                return false;
            }
            if (!moneyReg.test(budget)) {
                $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>预算格式不正确");
                return false;
            }
            API.onload(function() {
                API.agencyTripPlan.editTripPlanBudget({
                    consumeId:$scope.editBudgetId,
                    budget:budget
                })
                    .then(function(result){
                        $(".invoicePass,.invoiceNoPass,.editBudget").hide();
                        $scope.initTravelDetail();
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }

        //关闭弹窗
        $scope.invoiceColse = function () {
            $(".invoicePass,.invoiceNoPass,.editBudget").hide();
            $(".success").hide();
        }
    }



    return travelRecord;
})();

module.exports = travelRecord;