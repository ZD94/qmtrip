/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelplan=(function(){

    API.require('tripPlan');
    API.require('auth');
    API.require('attachment');
    API.require('staff');

    var  travelplan = {};

    /*
        出差单列表
     * @param $scope
     * @constructor
     */
    travelplan.PlanlistController = function($scope) {
        
        var p={page:1};//API参数：要显示的页数

        $scope.STATUS="未完成";
        $scope.statuses=["未完成","待出预算","待上传票据","票据审核中","审核不通过","已完成"];
        $scope.ORDER="默认";
        $scope.orders=["默认","预算最大","预算最小"];
        $scope.items=[];//“员工出差记录”
        $scope.total="";
        $scope.tips="";

        function enterSelectingMode(){//进入选择模式
            $(".veil").show();
            $("body").css({overflow:"hidden"});
            $(this).siblings(".dropdown-menu").slideDown();
        }
        function quitSelectingMode(){//退出选择模式
            $(".veil").hide();
            $(".dropdown-menu").hide();
            $("body").css({overflow:"scroll"});
        }

        $scope.selectStatus=function(i){
            $scope.STATUS=$scope.statuses[i];
        }

        $scope.selectOrder=function(i){
            $scope.ORDER=$scope.orders[i];
        }

        $scope.getList = function(){//获取员工出差列表并将列表显示在页面上。每执行一次该函数，列表中的记录增加十条。
            $scope.tips="正在加载更多";
            API.onload(function(){
                API.tripPlan.pageTripPlanOrder( p )
                    .then(
                        function(list){
                            console.log(API.tripPlan);
                            console.log(list);

                            $scope.items = $scope.items.concat(list.items);
                            p.page++;
                            $scope.tips="";
                            if(list.items.length<10){
                                $scope.tips="到底了，没有更多数据了";
                            }

                            var planlist = list.items;
                            $scope.total = list.total;                            
                            
                            planlist = planlist.map(function(plan){
                                return API.staff.getStaff({id:plan.accountId})
                                    .then(function(staff){
                                        plan.staffName = staff.staff.name;
                                        return plan;
                                    })
                                    .catch(function(err){
                                        TLDAlert(err.msg || err);
                                    })
                            })

                            Q.all(planlist)
                                .then(function(ret){
                                    $scope.planlist = ret;
                                    ret.map(function(s){
                                    })
                                    $scope.$apply();
                                })
                                .catch(function(err){
                                    TLDAlert(err.msg || err)
                                })

                            $scope.$apply();
                        }
                    )
                    .catch(function(err){
                        TLDAlert(err.msg || err)
                    })
            })
        }

        $scope.handleScroll = function(){//当页面滚动到底部时执行该函数
            if( $(document).scrollTop()==($(document).height()-$(window).height()) ){//如果滚动条已经到达页面底部
                $scope.getList();
            }
        }

        $scope.sortList = function(){//将出差记录排序
            var A = $scope.items;
            for( var i=0; i<A.length-1; i++ ){
                if( A[i].budget < A[i+1].budget ){
                    var max = A.splice(i+1,1);
                    
                }
            }
        }    

        $scope.enterDetail = function (orderId) {//进入详情页
            window.open("#/travelplan/plandetail?orderId=" + orderId);
        }

        $(".title").html("出差记录");
        loading(true);

        $scope.getList();
        $(window).on("scroll",$scope.handleScroll);
        $(".dropdown-header").on("click",enterSelectingMode);
        $(".veil").on("click",quitSelectingMode);
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