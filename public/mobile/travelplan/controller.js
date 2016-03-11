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
    //alert("no error");
    travelplan.PlanlistController = function($scope,$routeParams) {
        var p=$routeParams.status?
        $routeParams.status:
        {
            page:1,isComplete:false
        };//API参数：要显示的页数

        $scope.STATUS="未完成";
        $scope.statuses=["未完成","待出预算","待上传票据","票据审核中","审核不通过","已完成"];
        $scope.ORDER="默认";
        $scope.orders=["默认","预算最大","预算最小"];
        $scope.items=[];//“员工出差记录”
        $scope.withBalance=true;//状态为“已完成”的“出差记录”的预算是否有节余。
        $scope.total="";
        $scope.tips="";

        $scope.enterSelectingMode=function(){//进入“选择模式”
            $(".veil").show();
            $("body").css({overflow:"hidden"});
            $(this).siblings(".dropdown-menu").slideDown();
        }
        $scope.quitSelectingMode=function(){//退出“选择模式”
            $(".veil").hide();
            $(".dropdown-menu").hide();
            $("body").css({overflow:"scroll"});
        }

        $scope.selectStatus=function(i){//选择“状态”
            $scope.STATUS=$scope.statuses[i];
            $scope.items=[];
            if( $scope.STATUS==="未完成" ){
                $scope.getList( {page:1} );
            }else
            if( $scope.STATUS==="待出预算" ){
                $scope.getList( {page:1,status:-1} );
            }else
            if( $scope.STATUS==="待上传票据" ){
                $scope.getList( {page:1,status:0} );
            }else
            if( $scope.STATUS==="票据审核中" ){
                $scope.getList( {page:1,status:1,isCommit:true,auditStatus:0} );
            }else
            if( $scope.STATUS==="审核不通过" ){
                $scope.getList( {page:1,status:1,isCommit:true,auditStatus:-1} );
            }else
            if( $scope.STATUS==="已完成" ){
                $scope.getList( {page:1,status:2} );
            }
        }

        $scope.selectOrder=function(i){
            $scope.ORDER=$scope.orders[i];
        }

        $scope.renderItemStatus=function(i){
            if( $scope.items[i].status===-1 ){
                return "待出预算";
            }else
            if( $scope.items[i].status===0 ){
                return "待上传票据";
            }else
            if( $scope.items[i].status===1&&$scope.items[i].auditStatus===0 ){
                return "票据审核中";
            }else
            if( $scope.items[i].status===1&&$scope.items[i].auditStatus===-1 ){
                return "审核不通过";
            }else
            if( $scope.items[i].status===2 ){
                return "已完成";
            }
        }

        $scope.renderBalance=function(i){
            var balance = $scope.items[i].budget - $scope.items[i].expenditure;
            return Math.abs( balance );
        }

        $scope.renderBalanceOrDeficit=function(i){
            var balance = $scope.items[i].budget - $scope.items[i].expenditure;
            if( balance>=0 ){
                $scope.withBalance=true;
                return "节省";
            }else{
                $scope.withBalance=false;
                return "超支";
            }
        }

        $scope.getList = function( p ){//获取员工出差列表并将列表显示在页面上。每执行一次该函数，列表中的记录增加十条。
            $scope.tips="正在加载更多";
            API.onload(function(){
                API.tripPlan
                .pageTripPlanOrder( p )
                .then(
                    function(list){
                        console.log(API.tripPlan);
                        console.log(list);
                        console.log($scope.items)
                        if( $scope.items.length===0 && list.items.length===0 ){
                            $scope.tips='<p class="noRecord">没有出差记录</p><p class="seeOtherRecords">点击状态切换查看其他记录！</p>';
                        }else
                        if( list.items.length>0 ){
                            $scope.items = $scope.items.concat(list.items);
                            p.page++;
                            $scope.tips="";
                        }else                        
                        if( $scope.items.length>0 && list.items.length<10){
                            $scope.tips="到底了，没有更多数据了";
                        }

                        $scope.total = list.total;                            
                        
                        list.items = list.items.map(function(plan){
                            return (
                                API.staff
                                .getStaff( {id:plan.accountId} )
                                .then(function(staff){
                                    plan.staffName = staff.staff.name;
                                    return plan;
                                })
                                .catch(function(err){
                                    TLDAlert(err.msg || err);
                                })
                            )
                        })

                        Q.all(list.items)
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
                $scope.getList( p );
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

        $scope.getList( p );
        $(window).on("scroll",$scope.handleScroll);
        $(".dropdown-header").on("click",$scope.enterSelectingMode);
        $(".veil").on("click",$scope.quitSelectingMode);
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
                console.info(invoiceDetail)
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
            window.location.href = "#/travelplan/plandetail?planId="+planId;
        }
    }





    return travelplan;
})();

module.exports = travelplan;