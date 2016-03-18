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
                if( $routeParams.status==="待出预算" ){
                    $scope.STATUS=$routeParams.status;
                    return {page:1,isHasBudget:false};
                }else if( $routeParams.status==="待上传票据" ){
                    $scope.STATUS=$routeParams.status;
                    return {page:1,isUpload:false};
                }else if( $routeParams.status==="审核未通过" ){
                    $scope.STATUS=$routeParams.status;
                    return {page:1,audit:'N'};
                }else{
                    $scope.STATUS="未完成";
                    return {page:1,isComplete:false};
                };
            }else{
                $scope.STATUS="未完成";
                return {page:1,isComplete:false};
            }
        })();
        
        //-----------------------------------------------------------
        function init(){
            //页面上的所有交互All interacitve actions on this page
            $scope.$root.pageTitle="出差记录";
            loading(true);
            console.log( PARAMS );
            $scope.getList( PARAMS );
            $(window).on("scroll",$scope.handleScroll);
            $(".dropdown-header").on("click",$scope.enterSelectingMode);
            $(".veil").on("click",$scope.quitSelectingMode);
        };

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
                API.tripPlan
                .pageTripPlanOrder( p )
                .then(
                    function(list){

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

        $scope.ITEM={};
        $scope.URL={};
        $scope.timeSpan;//入住酒店的天数
        //---------------------------------------------
        $scope.getData = function( p ){//此函数用于获取 出差记录详情数据 并把它存入$scope.ITEM这一变量中。

            API.onload(function(){
                //console.info(p);
                API.tripPlan
                .getTripPlanOrderById( {orderId: p} )
                .then(
                    function( data ){
                        $scope.ITEM = data;
                        console.log( $scope.ITEM );
                        
                        $scope.timeSpan = (function(){
                            if( $scope.ITEM.hotel[0] ){
                                var t1=$scope.ITEM.hotel[0].startTime;
                                var t2=$scope.ITEM.hotel[0].endTime;
                                t1 = new Date(t1).getTime();
                                t2 = new Date(t2).getTime();
                                var timeSpan=(t2-t1)/1000/60/60/24;
                                console.log(t1,t2,timeSpan);
                                return timeSpan;
                            };
                        })();

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

        $scope.renderStatus = function( p,i ){

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
                if( p.orderStatus==="WAIT_COMMIT" ){
                    return "已上传";
                }else
                if( p.orderStatus==="WAIT_AUDIT" ){
                    return "票据审核中";
                }else
                if( p.orderStatus==="AUDIT_PASS" ){
                    return "已完成";
                };
            };
        }

        $scope.renderBUTTON = function(){

            if( $scope.ITEM.orderStatus==="WAIT_AUDIT" ){
                return "票据审核中";
            }else{
                return "提交审核";
            };
        }

        $scope.book = function( p ){//此函数在用户点击“预订”按钮时被调用。
            if( p==="outTraffic" ){
                API.onload(function(){
                    if( $scope.ITEM.outTraffic.length!==0 ){//获取预订去程的机票或火车票的网页的URL
                        var type = "air";
                        if( $scope.ITEM.outTraffic[0].invoiceType === 'TRAIN' ){
                            type = "train";
                        }
                        API.travelBudget.getBookListUrl({
                            spval : $scope.ITEM.outTraffic[0].startPlace,
                            epval : $scope.ITEM.outTraffic[0].arrivalPlace,
                            st : $scope.ITEM.outTraffic[0].startTime,
                            type : type
                        })
                        .then( function(outTrafficBookListUrl){
                            $scope.URL.outTrafficBookListUrl = outTrafficBookListUrl;
                            $scope.$apply();
                            window.location.href=$scope.URL.outTrafficBookListUrl;
                        })
                        .catch(function(err){
                            TLDAlert(err.msg || err);
                        })
                    }
                });               
            }else
            if( p==="backTraffic" ){
                if( $scope.ITEM.backTraffic.length!==0 ){
                    var type = "air";
                    if( $scope.ITEM.backTraffic[0].invoiceType === 'TRAIN' ){
                        type = "train";
                    }
                    API.travelBudget.getBookListUrl({
                        spval : $scope.ITEM.backTraffic[0].startPlace,
                        epval : $scope.ITEM.backTraffic[0].arrivalPlace,
                        st : $scope.ITEM.backTraffic[0].startTime,
                        type : type
                    })
                    .then( function(backTrafficBookListUrl){
                        $scope.URL.backTrafficBookListUrl = backTrafficBookListUrl;
                        $scope.$apply();
                        window.location.href=$scope.URL.backTrafficBookListUrl;
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    })
                }
            }else
            if( p==="hotel" ){
                if( $scope.ITEM.hotel.length!==0 ){
                    API.travelBudget.getBookListUrl({
                        hotelCity : $scope.ITEM.hotel[0].city,
                        hotelAddress : $scope.ITEM.hotel[0].hotelName,
                        from : 'mobile',
                        hotelSt : $scope.ITEM.hotel[0].startTime,
                        hotelEt : $scope.ITEM.hotel[0].endTime,
                        type : 'hotel'
                    })
                    .then( function( r ){
                        $scope.URL.hotelBookListUrl = r;
                        $scope.$apply();
                        console.log( $scope.URL.hotelBookListUrl );
                        window.location.href=$scope.URL.hotelBookListUrl;
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    })
                }
            };
        }

        $scope.checkInvoice = function( p ){//此函数在用户点击“查看票据”按钮时被调用。
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

        $scope.commit = function () {//此函数在用户点击“提交审核”按钮时被调用。
            if( $scope.ITEM.orderStatus==="WAIT_COMMIT" ){
                confirm( '确认提交','返回检查','票据一经提交将无法进行修改，是否确认提交？',function(){
                    API.onload(function() {
                        API.tripPlan.commitTripPlanOrder( $scope.ITEM.id )
                            .then(function(result){
                                location.reload();
                                black_err("提交审核成功");
                            })
                            .catch(function(err){
                                $(".confirmFixed").show();
                                console.info (err);
                            })
                    })
                });
            };
        }

        function init(){
            $scope.$root.pageTitle = "详细出差记录";
            loading(true);
            $scope.getData( $routeParams.orderId );
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