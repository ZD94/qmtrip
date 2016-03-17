/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelplan=(function(){

    API.require('tripPlan');
    API.require('auth');
    API.require('attachment');
    API.require('staff');
    API.require('travelBudget');

    var  travelplan = {};

    /*
        出差单列表
     * @param $scope
     * @constructor
     */
    //alert("no error");
    //["未完成","待出预算","待上传票据","票据审核中","审核未通过","已完成"]
    travelplan.PlanlistController = function($scope,$routeParams) {
        
        $scope.STATUS="未完成";//当前状态
        $scope.statuses=["未完成","待出预算","待上传票据","票据审核中","审核未通过","已完成"];
        $scope.ORDER="默认";//当前排序
        $scope.orders=["默认","预算最大","预算最小"];
        $scope.items=[];//“员工出差记录”
        $scope.withBalance=true;//状态为“已完成”的“出差记录”的预算是否有节余。
        $scope.total=null;
        $scope.tips="";

        var PARAMS = (function(){//API参数：要显示的页数
            if( $routeParams.status ){
                $scope.STATUS=$routeParams.status;
                if( $routeParams.status==="待出预算" ){
                    return {page:1,isHasBudget:false};
                }else
                if( $routeParams.status==="待上传票据" ){
                    return {page:1,isUpload:false};
                }else
                if( $routeParams.status==="审核未通过" ){
                    return {page:1,audit:'N'};
                };
            }else{
                return {page:1,isComplete:false};
            }
        })();
        
        //-----------------------------------------------------------
        function init(){
            //页面上的所有交互All interacitve actions on this page
            $scope.$root.pageTitle="出差记录";
            loading(true);

            $scope.getList( PARAMS );
            $(window).on("scroll",$scope.handleScroll);
            $(".dropdown-header").on("click",$scope.enterSelectingMode);
            $(".veil").on("click",$scope.quitSelectingMode);
            $(window).on("resize",setWidthOfText)
        };

        function setWidthOfText(){
            
        }

        $scope.enterSelectingMode=function(){//进入“选择模式”
            $(".veil").show();
            $("body").css({overflow:"hidden"});
            $(this).siblings(".dropdown-menu").slideDown();
            $(this).parent(".dropdown").siblings(".dropdown").find(".dropdown-menu").hide();
        }
        $scope.quitSelectingMode=function(){//退出“选择模式”
            $(".veil").hide();
            $(".dropdown-menu").hide();
            $("body").css({overflow:"scroll"});
        }

        $scope.selectStatus=function(i){//选择“状态”
            $scope.STATUS=$scope.statuses[i];
            $scope.ORDER="默认";
            $scope.items=[];
            if( $scope.STATUS==="未完成" ){
                PARAMS = {page:1,isComplete:false};
            }else
            if( $scope.STATUS==="待出预算" ){
                PARAMS = {page:1,isHasBudget:false};
            }else
            if( $scope.STATUS==="待上传票据" ){
                PARAMS = {page:1,isUpload:false};
            }else
            if( $scope.STATUS==="票据审核中" ){
                PARAMS = {page:1,audit:'P'};
            }else
            if( $scope.STATUS==="审核未通过" ){
                PARAMS = {page:1,audit:'N'};
            }else
            if( $scope.STATUS==="已完成" ){
                PARAMS = {page:1,isComplete:true};
            }
            $scope.getList( PARAMS );
            $scope.quitSelectingMode();
        }

        $scope.selectOrder=function(i){
            $scope.ORDER=$scope.orders[i];
            $scope.items=[];
            PARAMS.page=1;
            if( $scope.ORDER === "默认" ){
                PARAMS.order = null;
            }else
            if( $scope.ORDER === "预算最大" ){
                PARAMS.order = ["budget","desc"];
            }else
            if( $scope.ORDER === "预算最小" ){
                PARAMS.order = ["budget","asc"];
            }
            $scope.getList( PARAMS );
            $scope.quitSelectingMode();
        }

        $scope.renderItemStatus=function(i){
            if( $scope.items[i].status===-1 ){
                return "待出预算";
            }else
            if( $scope.items[i].status===0&&$scope.items[i].isCommit===false ){
                return "待上传票据";
            }else
            if( $scope.items[i].isCommit===true&&$scope.items[i].auditStatus===0 ){
                return "票据审核中";
            }else
            if( $scope.items[i].isCommit===true&&$scope.items[i].auditStatus===-1 ){
                return "审核未通过";
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
            $scope.tips="正在加载更多...";
            API.onload(function(){
                console.info(p);
                API.tripPlan
                .pageTripPlanOrder( p )
                .then(
                    function(list){
                        console.log(API.tripPlan);
                        console.log(list);
                        console.log($scope.items)
                        
                        $scope.items = $scope.items.concat(list.items);
                        $scope.total = list.total;
                        p.page++;

                        if( list.total===0 ){
                            $scope.tips='<p class="noRecord">没有出差记录</p><p class="seeOtherRecords">点击状态切换查看其他记录！</p>';
                        }else
                        if( list.total<=10 ){
                            $scope.tips="到底了，没有更多数据了";
                        }else                        
                        if( $scope.items.length===list.total ){
                            $scope.tips="到底了，没有更多数据了";
                        }

                        //$scope.total = list.total;                            
                        /*
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
                        */
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
                $scope.getList( PARAMS );
            }
        }

        $scope.enterDetail = function (orderId) {//进入详情页
            window.location="#/travelplan/plandetail?orderId=" + orderId;
        }

        init();

    }



    /*
     出差单详细
     * @param $scope
     * @constructor
     */
    travelplan.PlandetailController = function($scope, $routeParams) {

        $scope.ITEM=null;
        //---------------------------------------------
        $scope.getData = function( p ){

            API.onload(function(){
                console.info(p);
                API.tripPlan
                .getTripPlanOrderById( {orderId: p} )
                .then(
                    function( data ){
                        //console.log(API.tripPlan);
                        //console.log( data );
                        $scope.ITEM = data;
                        console.log( $scope.ITEM );
                        //console.log( $scope.ITEM.outTraffic[0] );
                        /*
                        if( $scope.ITEM.outTraffic.length!==0 ){
                            var type = "air";
                            if( $scope.ITEM.outTraffic[0].invoiceType === 0 ){
                                type = "train";
                            }
                            API.travelBudget.getBookListUrl({
                                spval : $scope.ITEM.outTraffic[0].startPlace,
                                epval : $scope.ITEM.outTraffic[0].arrivalPlace,
                                st : $scope.ITEM.outTraffic[0].startTime,
                                type : type
                            })
                            .then( function(outTrafficBookListUrl){
                                $scope.outTrafficBookListUrl = outTrafficBookListUrl;
                                $scope.$apply();
                            })
                            .catch(function(err){
                                TLDAlert(err.msg || err);
                            })
                        }
                        if(result.backTraffic.length!=0){
                            var type = "air";
                            if($scope.backTraffic.invoiceType == 0){
                                type = "train";
                            }
                            API.travelBudget.getBookListUrl({
                                spval : $scope.backTraffic.startPlace,
                                epval : $scope.backTraffic.arrivalPlace,
                                st : $scope.backTraffic.startTime,
                                type : type
                            })
                            .then(function(backTrafficBookListUrl){
                                $scope.backTrafficBookListUrl = backTrafficBookListUrl;
                                $scope.$apply();
                            })
                            .catch(function(err){
                                TLDAlert(err.msg || err);
                            })
                        }
                        if(result.hotel.length!=0){
                            API.travelBudget.getBookListUrl({
                                hotelCity : $scope.hotel.city,
                                hotelAddress : $scope.hotel.hotelName,
                                type : "hotel"
                            })
                            .then(function(hotelBookListUrl){
                                $scope.hotelBookListUrl = hotelBookListUrl;
                                $scope.$apply();
                            })
                            .catch(function(err){
                                TLDAlert(err.msg || err);
                            })
                        }

                        */







                        $scope.$apply();
                    }
                )
                .catch(function(err){
                    TLDAlert(err.msg || err)
                })
            })
        }

        $scope.renderDeficit = function(){
            return Math.abs($scope.ITEM.budget-$scope.ITEM.expenditure).toFixed(2);
        }

        $scope.renderStatus = function( p ){

            if( p ){
                if( p.orderStatus==="NO_BUDGET" ){
                    return "待出预算";
                }else
                if( p.orderStatus==="WAIT_UPLOAD" ){
                    return "待上传票据";
                }else
                if( p.orderStatus==="AUDIT_NOT_PASS" ){
                    return "审核未通过";
                }else
                if( p.isCommit===true&&p.status===0 ){
                    return "票据已上传";
                }else
                if( p.orderStatus==="AUDIT_PASS" ){
                    return "已完成";
                };
            };
        }

        $scope.renderBUTTON = function(){
            /*
            if( ITEM.orderStatus==="WAIT_UPLOAD" ){
                return "提交审核";
            }else
            if( ITEM.orderStatus==="WAIT_AUDIT" ){
                return "票据审核中";
            }else{
            */    
            return "提交审核";
        }

        $scope.book = function(){

        }

        $scope.checkInvoice = function( p ){
            if( p==="outTraffic" ){
                window.location.href="#/travelplan/invoicedetail?planId="+$scope.ITEM.id+"&status="+p+"&invoiceId="+$scope.ITEM.outTraffic[0].newInvoice;
            }else
            if( p==="backTraffic" ){
                window.location.href="#/travelplan/invoicedetail?planId="+$scope.ITEM.id+"&status="+p+"&invoiceId="+$scope.ITEM.backTraffic[0].newInvoice;
            }else
            if( p==="hotel" ){
                window.location.href="#/travelplan/invoicedetail?planId="+$scope.ITEM.id+"&status="+p+"&invoiceId="+$scope.ITEM.hotel[0].newInvoice;
            };
        }

        $scope.commit = function(){

        }

        function init(){
            $scope.$root.pageTitle = "详细出差记录";
            loading(true);
            $scope.getData( $routeParams.orderId );
            //console.log( $scope.ITEM.outTraffic[0] );
        }
        //----------------------------------------------------------------
        init();

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
            API.tripPlan.getTripPlanOrderById({orderId: planId})
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