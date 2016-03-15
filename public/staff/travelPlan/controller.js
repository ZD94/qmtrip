/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelPlan=(function(){

    API.require('tripPlan');
    API.require("auth");
    API.require("attachment");

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
        //全部列表
        $scope.initPlanList = function () {
            API.onload(function() {
                var params = {page:$scope.page1};
                if ($scope.keyword != '' && $scope.keyword != undefined) {
                    params.remark = {$like: '%'+ $scope.keyword + '%'};
                }
                params.perPage = 20; //默认20条/页
                API.tripPlan.pageTripPlanOrder(params)
                    .then(function(result){
                        $scope.total1 = result.total;
                        $scope.planListitems = result.items;
                        loading(true);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    })
            })
        }

        //待出预算列表
        $scope.initPlanList2 = function () {
            API.onload(function() {
                API.tripPlan.pageTripPlanOrder({status:'-1',page:$scope.page2})
                    .then(function(result){
                        console.info (result);
                        $scope.total2 = result.total;
                        $scope.planListitems2 = result.items;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    })
            })
        }

        //待上传票据列表
        $scope.initPlanList3 = function () {
            API.onload(function() {
                API.tripPlan.pageTripPlanOrder({status:0,page:$scope.page3})
                    .then(function(result){
                        $scope.total3 = result.total;
                        $scope.planListitems3 = result.items;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    })
            })
        }

        //已完成列表
        $scope.initFinishPlanList = function () {
            API.onload(function() {
                API.tripPlan.pageCompleteTripPlanOrder({page:$scope.page4})
                    .then(function(result){
                        $scope.total4 = result.total;
                        $scope.finishPlanListitems = result.items;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    })
            })
        }


        //全部分页
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
                        $scope.initPlanList();
                    }
                });
                clearInterval(pagenum1);
            }
        }
        var pagenum1 =setInterval($scope.pagination1,1);

        //待出预算分页
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
                        $scope.initPlanList2();
                    }
                });
                clearInterval(pagenum2);
            }
        }
        var pagenum2 =setInterval($scope.pagination2,1);

        //待上传票据分页
        $scope.pagination3 = function () {
            if ($scope.total3) {
                $.jqPaginator('#pagination3', {
                    totalCounts: $scope.total3,
                    pageSize: 10,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page3 = num;
                        $scope.initPlanList3();
                    }
                });
                clearInterval(pagenum3);
            }
        }
        var pagenum3 =setInterval($scope.pagination3,1);

        //已完成分页
        $scope.pagination4 = function () {
            if ($scope.total4) {
                $.jqPaginator('#pagination4', {
                    totalCounts: $scope.total4,
                    pageSize: 10,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page4 = num;
                        $scope.initFinishPlanList();
                    }
                });
                clearInterval(pagenum4);
            }
        }
        var pagenum4 =setInterval($scope.pagination4,1);

        $scope.searchKeyword = function () {
            if ($scope.keyword != '' && $scope.keyword != undefined) {
                $scope.initPlanList();
                setTimeout($scope.pagination1,100);
            }
            else {
                $scope.initPlanList();
            }
        }


        $scope.initPlanList();
        $scope.initPlanList2();
        $scope.initPlanList3();
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
                        TLDAlert(err.msg || err);
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
        loading(false);
        $("title").html("出差单明细");
        var planId = $routeParams.planId;
        $scope.initplandetail = function(){
            API.onload(function() {
                API.tripPlan.getTripPlanOrderById(planId)
                    .then(function(result){
                        $scope.planDetail = result;
                        $scope.backTraffic = $scope.planDetail.backTraffic[0];
                        $scope.hotel = $scope.planDetail.hotel[0];
                        $scope.outTraffic = $scope.planDetail.outTraffic[0];
                        loading(true);
                        $scope.$apply();
                        $('.warning i').hover(function(){
                            //$('.warning .special_warning').show();
                            $('.special_warning').hide();
                            $(this).siblings('.special_warning').show();
                        },function(){
                            $(this).siblings('.special_warning').hide();

                            //$('.warning .special_warning').hide();
                        });
                        $(".file").AjaxFileUpload({
                            action: '/upload/ajax-upload-file?type=invoice',
                            onComplete: function(filename, response) {
                                $scope.ref = $(this).attr("ref");
                                $scope.fileId = response.fileId;
                                if (response.ret == 0 ) {
                                    //上传本人预览图片方法一通过api访问预览
                                    API.attachment.previewSelfImg({fileId: response.fileId}, function(err, img) {
                                        if (err) {
                                            return TLDAlert(err.msg);
                                        }

                                        var ImgSrc = img;
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
                                    })
                                } else {
                                    TLDAlert(response.errMsg);
                                }
                            }
                        });
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    })
                    $scope.updateToServer = function() {
                        var invoice = {
                            userId: $scope.staff.id,
                            consumeId:$scope.ref,
                            picture:$scope.fileId
                        }
                        API.onload(function(){
                            API.tripPlan.uploadInvoice(invoice)
                                .then(function(ret){
                                    console.info(ret);
                                    // location.reload();
                                    $scope.initplandetail();
                                    $("#uploadimg").hide();
                                    TLDAlert("票据上传成功");
                                })
                                .catch(function(err){
                                    TLDAlert(err.msg || err);
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
        $scope.initplandetail();
        $scope.submit = function () {
            API.onload(function() {
                API.tripPlan.commitTripPlanOrder(planId)
                    .then(function(result){
                        location.reload();
                        alert ("提交成功");
                    })
                    .catch(function(err){
                        $(".confirmFixed").show();
                        console.info (err);
                    })
            })
        }

        //关闭弹窗
        $scope.confirmClose = function () {
            $(".confirmFixed").hide();
        }

        $scope.goDetail = function (status,invoiceId) {
            window.location.href = "#/travelPlan/InvoiceDetail?planId="+planId+"&status="+status+"&invoiceId="+invoiceId;
        }
        
        $scope.initscan = function(){
            var backUrl = "http://"+window.location.host+"/mobile.html#/tripPlan/uploadImg?planId="+planId;
            API.onload(function() {
                API.auth.getQRCodeUrl({backUrl: backUrl})
                    .then(function(content) {
                        // console.info(content);
                        // new QRCode(document.getElementById("qrcode"), content);
                        var qrcode = require('arale-qrcode');
                        var browser = navigator.appName;
                        var b_version = navigator.appVersion;
                        var version = b_version.split(";");
                        if (version.length > 1) {
                            var trim_Version = parseInt(version[1].replace(/[ ]/g, "").replace(/MSIE/g, ""));
                            if (trim_Version < 9) {
                                // alert(“LowB,快升级你的IE”)
                                var qrnode = new qrcode({
                                    correctLevel: 3,
                                    render: 'svg',
                                    text: content,
                                    size: 256,
                                    pdground: '#000000',
                                    image : 'staff/images/s_menu1.png',
                                    imageSize:50
                                });
                                document.getElementById('qrcode').appendChild(qrnode);
                                return false;
                            }
                        }
                        
                        var qrnode = new qrcode({
                            correctLevel: 3,
                            render: 'canvas',
                            text: content,
                            size: 256,
                            pdground: '#000000',
                            image : 'staff/images/s_menu1.png',
                            imageSize:50
                        });
                        document.getElementById('qrcode').appendChild(qrnode);
                        return true;
                    })
                    .catch(function(err) {
                        alert(err);
                    })
                    .done();
            })
        }
        var time;
        var start = 60;
        var max = 60;
        $scope.alertScan = function(){
            var sw = $(".scancode").width()/2;
            var sh = $(".scancode").height()/2;
            $(".scancode").css({"margin-top":-sh,"margin-left":-sw});
            $("#qrcode").find("canvas").remove();
            $(".scan_fixed").show();
            if(time){
                clearInterval(time);
            }
            time = setInterval(function(){
                if(start<=0) {
                    $("#qrcode").find("img").remove();
                    $("#qrcode").find("canvas").remove();
                    $scope.initscan();
                    start=max;
                }else if(start >= max){
                    $scope.initscan();   
                }
                start = start -1;
                $scope.seconds = start;
                $scope.$apply();
            },1000);
        }
        $scope.close_scan = function(){
            start = max;
            clearInterval(time);
            $scope.seconds = start;
            $(".scan_fixed #qrcode").find("img").remove();
            $("#qrcode").find("canvas").remove();
            $(".scan_fixed").hide();
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



    return travelPlan;
})();

module.exports = travelPlan;