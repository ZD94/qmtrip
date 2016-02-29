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
        //全部
        $scope.initTravelList1 = function () {
            $(".left_nav li").removeClass("on").eq(0).addClass("on");

            API.onload(function () {
                API.agencyTripPlan.pageTripPlanOrder({page:$scope.page1, perPage:20, isUpload: true, audit: 'P'})
                    .then(function(result){
                        console.info (result);
                        $scope.total1 = result.total;
                        $scope.pages1 = result.pages;
                        var travelList1 = result.items;
                        travelList1.map(function(s){
                            Q.all([
                                API.staff.getStaffByAgency({id:s.accountId}),
                                API.company.getCompanyById(s.companyId)
                            ])
                                .spread(function(ret1,ret2){
                                    s.travelerName = ret1;
                                    s.companyName = ret2;
                                    $scope.travelListitems1 = travelList1;
                                    $scope.$apply();
                                    loading(true);
                                })
                                .catch(function(err) {
                                    TLDAlert(err.msg || err);
                                });
                        });
                    })
                    .catch(function(err) {
                        TLDAlert(err.msg || err);
                    });
            })
        }

        //待出预算
        $scope.initTravelList2 = function () {
            API.onload(function () {
                API.agencyTripPlan.pageTripPlanOrder({page:$scope.page2, perPage:20, isUpload: true, budget: {lt: 0}, audit: 'P'})
                    .then(function(result){
                        console.info (result);
                        $scope.total2 = result.total;
                        $scope.pages2 = result.pages;
                        var travelList2 = result.items;
                        travelList2.map(function(s){
                            Q.all([
                                API.staff.getStaffByAgency({id:s.accountId}),
                                API.company.getCompanyById(s.companyId)
                            ])
                                .spread(function(ret1,ret2){
                                    s.travelerName = ret1;
                                    s.companyName = ret2;
                                    $scope.travelListitems2 = travelList2;
                                    $scope.$apply();
                                    loading(true);
                                })
                                .catch(function(err) {
                                    TLDAlert(err.msg || err);
                                });
                        });
                    })
                    .catch(function(err) {
                        TLDAlert(err.msg || err);
                    });
            })
        }

        //待审核
        $scope.initTravelList3 = function () {
            API.onload(function () {
                API.agencyTripPlan.pageTripPlanOrder({page:$scope.page3, perPage:20, isUpload: true, budget: {gt: 0}, audit: 'P'})
                    .then(function(result){
                        console.info (result);
                        $scope.total3 = result.total;
                        $scope.pages3 = result.pages;
                        var travelList3 = result.items;
                        travelList3.map(function(s){
                            Q.all([
                                API.staff.getStaffByAgency({id:s.accountId}),
                                API.company.getCompanyById(s.companyId)
                            ])
                                .spread(function(ret1,ret2){
                                    s.travelerName = ret1;
                                    s.companyName = ret2;
                                    $scope.travelListitems3 = travelList3;
                                    $scope.$apply();
                                    loading(true);
                                })
                                .catch(function(err) {
                                    TLDAlert(err.msg || err);
                                });
                        });
                    })
                    .catch(function(err) {
                        TLDAlert(err.msg || err);
                    });
            })
        }
        $scope.initTravelList1();
        $scope.initTravelList2();
        $scope.initTravelList3();

        //分页1
        $scope.pagination1 = function () {
            if ($scope.total1) {
                $.jqPaginator('#pagination1', {
                    totalCounts: $scope.total1,
                    pageSize: 20,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page1 = num;
                        $scope.initTravelList1();
                    }
                });
                clearInterval (pagenum1);
            }
        }
        var pagenum1 =setInterval($scope.pagination1,10);


        //分页2
        $scope.pagination2 = function () {
            if ($scope.total2) {
                $.jqPaginator('#pagination2', {
                    totalCounts: $scope.total2,
                    pageSize: 20,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page2 = num;
                        $scope.initTravelList2();
                    }
                });
                clearInterval (pagenum2);
            }
        }
        var pagenum2 =setInterval($scope.pagination2,10);

        //分页3
        $scope.pagination3 = function () {
            if ($scope.total3) {
                $.jqPaginator('#pagination3', {
                    totalCounts: $scope.total3,
                    pageSize: 20,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page3 = num;
                        $scope.initTravelList3();
                    }
                });
                clearInterval (pagenum3);
            }
        }
        var pagenum3 =setInterval($scope.pagination3,10);



        //未完成已完成选项卡
        $('.mainbox_top li').click(function(){
            var i = $(this).index();
            $('.mainbox_top li').removeClass('active');
            $(this).addClass('active');
            $('.mainbox_bottom,.pagination').hide();
            $('.mainbox_bottom').eq(i).show();
            $('.pagination').eq(i).show();
        })
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
                        console.info (result);
                        var outTraffic = result.outTraffic[0];
                        var backTraffic = result.backTraffic[0];
                        var hotel = result.hotel[0];


                        $scope.planDetail = result;
                        $scope.outTraffic = $scope.planDetail.outTraffic[0];
                        $scope.backTraffic = $scope.planDetail.backTraffic[0];
                        $scope.hotel = $scope.planDetail.hotel[0];
                        //console.info("执行到A==>", hotel, backTraffic, outTraffic);

                        var outTraffics = $scope.planDetail.outTraffic;
                        var backTraffics = $scope.planDetail.backTraffic;
                        var hotels = $scope.planDetail.hotel;

                        if (hotel && hotel.newInvoice) {
                            $scope.hotelInvoiceImg = "/consume/invoice/" + hotel.id;
                        }

                        if (backTraffic && backTraffic.newInvoice) {
                            $scope.backTrafficInvoiceImg = "/consume/invoice/" + backTraffic.id;
                        }

                        if (outTraffic && outTraffic.newInvoice) {
                            $scope.outTrafficInvoiceImg = "/consume/invoice/" + outTraffic.id;
                        }

                        outTraffic = outTraffics.map(function(outTraffic){
                            if(!outTraffic.newInvoice) {
                                return outTraffic;
                            }

                            return API.agencyTripPlan.getConsumeInvoiceImg({consumeId: outTraffic.id})
                                .then(function(invoiceImg){
                                    outTraffic.invoiceImg = invoiceImg;

                                    if(!outTraffic.auditUser){
                                        return outTraffic;
                                    }

                                    return API.agency.getAgencyUser(outTraffic.auditUser)
                                        .then(function(auditName) {
                                            outTraffic.auditName = auditName;
                                            return outTraffic
                                        })
                                })

                        });

                        backTraffics = backTraffics.map(function(backTraffic){
                            if(!backTraffic.newInvoice) {
                                return backTraffic;
                            }

                            return API.agencyTripPlan.getConsumeInvoiceImg({consumeId: backTraffic.id})
                                .then(function(invoiceImg){
                                    backTraffic.invoiceImg = invoiceImg;

                                    if(!backTraffic.auditUser){
                                        return backTraffic;
                                    }

                                    return API.agency.getAgencyUser(backTraffic.auditUser)
                                        .then(function(auditName) {
                                            backTraffic.auditName = auditName;
                                            return backTraffic
                                        })
                                })

                        });

                        hotels = hotels.map(function(hotel){
                            if(!hotel.newInvoice) {
                                return hotel;
                            }

                            return API.agencyTripPlan.getConsumeInvoiceImg({consumeId: hotel.id})
                                .then(function(invoiceImg){
                                    hotel.invoiceImg = invoiceImg;

                                    if(!hotel.auditUser){
                                        return hotel;
                                    }

                                    return API.agency.getAgencyUser(hotel.auditUser)
                                        .then(function(auditName) {
                                            hotel.auditName = auditName;
                                            return hotel
                                        })
                                })

                        });

                        Q.all(hotels)
                            .then(function(hotels) {
                                $scope.hotels = hotels;
                                $scope.$apply();
                            })
                            .catch(function(err) {
                                console.info("hotels");
                                console.info(err);
                                TLDAlert(err.msg || err);
                            })

                        Q.all(outTraffics)
                            .then(function(outTraffics) {
                                $scope.outTraffics = outTraffics;
                                console.info(outTraffics);
                                $scope.$apply();
                            })
                            .catch(function(err) {
                                console.info("outTraffics");
                                console.info(err);
                                TLDAlert(err.msg || err);
                            })

                        Q.all(backTraffics)
                            .then(function(backTraffics) {
                                $scope.backTraffics = backTraffics;
                                $scope.$apply();
                            })
                            .catch(function(err) {
                                console.info("backTraffics");
                                console.info(err);
                                TLDAlert(err.msg || err);
                            })

                        API.staff.getStaffByAgency({id:$scope.planDetail.accountId})
                            .then(function(result){
                                $scope.travelerName = result.name;
                                $scope.$apply();
                            })
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
                        TLDAlert(err.msg || err);
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
            $scope.remark = reason1 + "," + reason2 + "," + reasontext;
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
                        TLDAlert(err.msg || err);
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
                        TLDAlert(err.msg || err);
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