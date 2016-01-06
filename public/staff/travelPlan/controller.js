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
        //待上传票据列表
        $scope.initPlanList = function () {
            var params = {auditStatus: [-1, 0]};
            if ($scope.keyword !='' && $scope.keyword !=undefined) {
                params.$like = ['startPlace', '%' + $scope.keyword + '%'];
            }
            console.info (params);
            API.onload(function() {
                API.tripPlan.listTripPlanOrder(params)
                    .then(function(result){
                        $scope.planListitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }
        //已完成列表
        $scope.initFinishPlanList = function () {
            API.onload(function() {
                API.tripPlan.listTripPlanOrder({auditStatus: [1]})
                    .then(function(result){
                        $scope.finishPlanListitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }
        $scope.initPlanList();
        $scope.initFinishPlanList();

        //进入详情页
        $scope.enterDetail = function (id) {
            window.location.href = "#/travelPlan/PlanDetail?planId="+id;
        }

        //未完成关键字模糊查询
        $scope.searchKeyword = function () {
            $scope.initPlanList();
        }

        //删除
        $scope.deletePlan = function () {
            API.onload(function() {
                console.info(1111111111);
                API.tripPlan.deleteTripPlanOrder('d3a389b0-ae13-11e5-b799-3fa6e9e1404b')
                    .then(function(result){
                        Myalert("温馨提示","删除成功");
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info(err);
                    });
            })
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
                    var customerId = "";
                    $(".file").AjaxFileUpload({
                        action: '/upload/ajax-upload-file?type=invoice',
                        onComplete: function(filename, response) {
                            $scope.ref = $(this).attr("ref");
                            $scope.md5 = response.md5key;
                            if (response.ret == 0 ) {
                                var htmlStr = '<img src="/upload/get-img-file/'+response.md5key+'" alt="">';
                                // $(this).siblings("input[type=hidden]").val(response.md5key);
                                $scope.htmlStr = htmlStr;
                              console.info(response);
                              // $scope.fileUrl = response.fileUrl;
                            } else {
                              alertDemo(response.errMsg);
                            }
                            updateinvoice("上传");
                            position();
                        }
                    });
                    var invoice = {
                        userId: $scope.staff.id,
                        consumeId:$scope.ref;
                        picture:$scope.md5;
                    }
                    
                    $scope.$apply();
                })
                function updateToServer() {
                    var invoice = {
                        userId: $scope.staff.id,
                        consumeId:$scope.ref;
                        picture:$scope.md5;
                    }
                    API.onload(function(){
                        API.tripPlan.uploadInvoice(invoice)
                            .then(function(ret){
                                console.info(err)
                            })
                            .catch(function(err){
                                console.info(err)
                            })
                    })
                }
                function updateinvoice(title) {
                    $(".messagebox_fixed").remove();
                    var str = "";
                    var htmlStr="";
                    str += "<div class='messagebox_fixed'>";
                    str += "<div class='messagebox_box'>";
                    str += "<div class='messagebox_title'>"+title+"<div class='messagebox_close' onclick='messagebox_close()'><img src='/images/closezjx.png' style='display: block;'></div></div>";
                    str += "<div class='messagebox_content'>"+$scope.htmlStr+"</div>";
                    str += "</div>";
                    str += "</div>";
                    $("body").append(str);
                    $(".messagebox_fixed").fadeIn();
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