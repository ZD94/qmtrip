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
        loading(false);
        $("title").html("出差单列表");
        //待上传票据列表
        $scope.initPlanList = function () {
            API.onload(function() {
                API.tripPlan.pageTripPlanOrder({isUpload: false, page:$scope.page,perPage:10})
                    .then(function(result){
                        console.info (result);
                        $scope.total = result.total;
                        $scope.planListitems = result.items;
                        loading(true);
                        $scope.$apply();
                        $(".content input").click(function(event){
                            event.stopPropagation();
                        });
                        $(".file").AjaxFileUpload({
                            action: '/upload/ajax-upload-file?type=invoice',
                            onComplete: function(filename, response) {
                                $scope.ref = $(this).attr("ref");
                                $scope.md5 = response.md5key;
                                if (response.ret == 0 ) {
                                    var ImgSrc = '/upload/get-img-file/'+response.md5key;// var htmlStr = '<img src="/upload/get-img-file/'+response.md5key+'" alt="">';
                                    var invoiceType = "";// $scope.htmlStr = htmlStr;
                                    if ($(this).attr("data-type") == 1) {
                                        invoiceType = "去程交通票据";
                                    }else if ($(this).attr("data-type") == 2) {
                                        invoiceType = "住宿票据";
                                    }
                                    else if ($(this).attr("data-type") == 3) {
                                        invoiceType = "返程交通票据";
                                    }
                                    $(".messagebox_content img").attr("src",ImgSrc);
                                    $(".messagebtns em").html(invoiceType);
                                    $(".messagebox_fixed").show();
                                    position();
                                } else {
                                  alertDemo(response.errMsg);
                                }
                            }
                        });
                    })
                    .catch(function(err){
                        console.info(err);
                    })
                    $scope.updateToServer = function() {
                        var invoice = {
                            userId: $scope.staff.id,
                            consumeId:$scope.ref,
                            picture:$scope.md5
                        }
                        API.onload(function(){
                            API.tripPlan.uploadInvoice(invoice)
                                .then(function(ret){
                                    console.info(ret);
                                    location.reload();
                                })
                                .catch(function(err){
                                    console.info(err);
                                })
                        })
                    }
                    function position() {
                        var boxwidth = $('.messagebox_box').width();
                        var boxheight = $('.messagebox_box').height();
                        $(".messagebox_box").css('margin-left',-boxwidth/2);
                        $(".messagebox_box").css('margin-top',-boxheight/2);
                    }
            })
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
                        $scope.initPlanList();
                    }
                });
                clearInterval (pagenum);
            }
        }
        var pagenum =setInterval($scope.pagination,1);






        //已完成列表
        $scope.initFinishPlanList = function () {
            API.onload(function() {
                API.tripPlan.pageCompleteTripPlanOrder({})
                    .then(function(ret){
                        console.info(ret);
                        $scope.finishPlanListitems = ret.items;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }
        $scope.initPlanList();
        $scope.initFinishPlanList();


        $scope.countSec = function () {

        }
        setTimeout($scope.countSec, 1500);

        //进入详情页
        $scope.enterDetail = function (id) {
            window.location.href = "#/travelPlan/PlanDetail?planId="+id;
        }

        //未完成关键字模糊查询
        $scope.searchKeyword = function () {
            $scope.initPlanList();
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
                    $(".file").AjaxFileUpload({
                        action: '/upload/ajax-upload-file?type=invoice',
                        onComplete: function(filename, response) {
                            console.info("000000");
                            $scope.ref = $(this).attr("ref");
                            $scope.md5 = response.md5key;
                            if (response.ret == 0 ) {
                                var ImgSrc = '/upload/get-img-file/'+response.md5key;
                                var invoiceType = "";
                                if ($(this).attr("data-type") == 1) {
                                    invoiceType = "去程交通票据";
                                }else if ($(this).attr("data-type") == 2) {
                                    invoiceType = "住宿票据";
                                }
                                else if ($(this).attr("data-type") == 3) {
                                    invoiceType = "返程交通票据";
                                }
                                $(".messagebox_content img").attr("src",ImgSrc);
                                $(".messagebtns em").html(invoiceType);
                                $(".messagebox_fixed").show();
                                position();
                            } else {
                              alertDemo(response.errMsg);
                            }
                        }
                    });
                    
                })
                .catch(function(err){
                    console.info(err);
                })
                $scope.updateToServer = function() {
                    var invoice = {
                        userId: $scope.staff.id,
                        consumeId:$scope.ref,
                        picture:$scope.md5
                    }
                    API.onload(function(){
                        API.tripPlan.uploadInvoice(invoice)
                            .then(function(ret){
                                console.info(ret);
                                location.reload();
                            })
                            .catch(function(err){
                                console.info(err);
                            })
                    })
                }
                function position() {
                    var boxwidth = $('.messagebox_box').width();
                    var boxheight = $('.messagebox_box').height();
                    $(".messagebox_box").css('margin-left',-boxwidth/2);
                    $(".messagebox_box").css('margin-top',-boxheight/2);
                }
        })
    }



    return travelPlan;
})();

module.exports = travelPlan;