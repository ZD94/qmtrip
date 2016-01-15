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
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(1).find("li").addClass("on");
        loading(false);
        $("title").html("出差单列表");
        //待上传票据列表
        $scope.initPlanList = function () {
            API.onload(function() {
                var params = {auditStatus:[0,-1],page:$scope.page1};
                if ($scope.keyword != '' && $scope.keyword != undefined) {
                    params.remark = {$like: '%'+ $scope.keyword + '%'};
                }
                API.tripPlan.pageTripPlanOrder(params)
                    .then(function(result){
                        console.info (result);
                        $scope.total1 = result.total;
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
                                    $("#uploadimg").show();
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
                                    $scope.initPlanList();
                                    $("#uploadimg").hide();
                                })
                                .catch(function(err){
                                    console.info(err);
                                })
                        })
                    }
                    function position() {
                        var boxwidth = $('#uploadimg .messagebox_box').width();
                        var boxheight = $('#uploadimg .messagebox_box').height();
                        $("#uploadimg .messagebox_box").css('margin-left',-boxwidth/2);
                        $("#uploadimg .messagebox_box").css('margin-top',-boxheight/2);
                    }
            })
        }

        //已完成列表
        $scope.initFinishPlanList = function () {
            API.onload(function() {
                var params = {page:$scope.page2};
                if ($scope.finishKeyword != '' && $scope.finishKeyword != undefined) {
                    params.remark = {$like: '%'+ $scope.finishKeyword + '%'};
                }
                API.tripPlan.pageCompleteTripPlanOrder(params)
                    .then(function(result){
                        console.info (result);
                        $scope.total2 = result.total;
                        $scope.finishPlanListitems = result.items;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }


        //未完成分页
        $scope.pagination1 = function () {
            if ($scope.total1) {
                $.jqPaginator('#pagination1', {
                    totalCounts: $scope.total1,
                    pageSize: 10,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page1 = num;
                        $scope.initPlanList();
                    }
                });
                clearInterval (pagenum1);
            }
        }
        var pagenum1 =setInterval($scope.pagination1,1);

        //已完成分页
        $scope.pagination2 = function () {
            if ($scope.total2) {
                $.jqPaginator('#pagination2', {
                    totalCounts: $scope.total2,
                    pageSize: 10,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page2 = num;
                        $scope.initFinishPlanList();
                    }
                });
                clearInterval (pagenum2);
            }
        }
        var pagenum2 =setInterval($scope.pagination2,1);

        $scope.searchKeyword = function () {
            if ($scope.keyword != '' && $scope.keyword != undefined) {
                $scope.initPlanList();
                setTimeout($scope.pagination1,100);
            }
            else {
                $scope.initPlanList();
            }
        }

        $scope.searchFinishKeyword = function () {
            if ($scope.finishKeyword != '' && $scope.finishKeyword != undefined) {
                $scope.initFinishPlanList();
                setTimeout($scope.pagination2,100);
            }
            else {
                $scope.initFinishPlanList();
            }
        }


        $scope.initPlanList();
        $scope.initFinishPlanList();


        //进入详情页
        $scope.enterDetail = function (id) {
            window.location.href = "#/travelPlan/PlanDetail?planId="+id;
        }

        //删除
        $scope.deletePlan = function () {
            API.onload(function() {
                API.tripPlan.deleteTripPlanOrder('f0f4f8c0-b5e6-11e5-88bb-9f621eb43a70')
                    .then(function(result){
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }


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
    travelPlan.PlanDetailController = function($scope, $routeParams) {
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(1).find("li").addClass("on");
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
                    $scope.$apply();
                    $(".file").AjaxFileUpload({
                        action: '/upload/ajax-upload-file?type=invoice',
                        onComplete: function(filename, response) {
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
                                $("#uploadimg").show();
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
                    var boxwidth = $('#uploadimg .messagebox_box').width();
                    var boxheight = $('#uploadimg .messagebox_box').height();
                    $("#uploadimg .messagebox_box").css('margin-left',-boxwidth/2);
                    $("#uploadimg .messagebox_box").css('margin-top',-boxheight/2);
                }
        })
        $scope.goDetail = function (status,invoiceId) {
            window.location.href = "#/travelPlan/InvoiceDetail?planId="+planId+"&status="+status+"&invoiceId="+invoiceId;
        }
    }






    /*
     行程单详细
     * @param $scope
     * @constructor
     */
    travelPlan.InvoiceDetailController = function($scope, $routeParams) {
        loading(true);
        $("title").html("行程单明细");
        var planId = $routeParams.planId;
        $scope.planId = planId;
        $scope.status = $routeParams.status;
        $scope.invoiceId = $routeParams.invoiceId;
        API.onload(function() {
            API.tripPlan.getTripPlanOrderById(planId)
                .then(function(result){
                    $scope.planDetail = result;
                    if ($scope.status=='outTraffic') {
                        $scope.InvoiceDetail = $scope.planDetail.outTraffic[0];
                    }
                    if ($scope.status=='backTraffic') {
                        $scope.InvoiceDetail = $scope.planDetail.backTraffic[0];
                    }
                    if ($scope.status=='hotel') {
                        $scope.InvoiceDetail = $scope.planDetail.hotel[0];
                    }

                    console.info (result);
                    $scope.$apply();
                })
                .catch(function(err){
                    console.info(err);
                })
        })
        $scope.goDetail = function () {
            window.location.href = "#/travelPlan/PlanDetail?planId="+planId;
        }
    }



    return travelPlan;
})();

module.exports = travelPlan;