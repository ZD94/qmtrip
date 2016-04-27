/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelplan = (function () {

    var msgbox = require('msgbox');

    API.require('tripPlan');
    API.require('auth');
    API.require('attachment');
    API.require('staff');
    API.require('travelBudget');

    var travelplan = {};

    /*
     出差单列表
     * @param $scope
     * @constructor
     */
    travelplan.PlanlistController = function ($scope, $stateParams, $loading) {
        $scope.$root.pageTitle = '出差记录';
        // @data 状态的列表。
        $scope.statuses = ["未完成", "待出预算", "待预订", "待上传票据", "票据审核中", "审核未通过", "已完成"];
        // @data 排序选项的列表。
        $scope.orders = ["默认", "预算最大", "预算最小"];
        // @data “员工出差记录”
        $scope.items = [];

        // @state 当前状态。
        $scope.STATUS = "未完成";
        // @state 当前排序的状态。
        $scope.ORDER = "默认";
        
        // 状态为“已完成”的“出差记录”的预算是否有节余。
        $scope.withBalance = true;
        $scope.total = null;
        // @state 该变量将在$scope.getList的运行过程中被重新赋值。
        $scope.tips = "";

        //-------------------------------------------- Modified by LH on 2016-03-19
        var STATUS_STORES = {
            "WAIT": "待出预算",
            "WAIT_UPLOAD": "待上传票据",
            "REJECT": "审核未通过",
            "UN_FINISH": "未完成"
        }

        var statue = $stateParams.status || 'UN_FINISH';
        var display = STATUS_STORES[statue];
        if (!display) {
            statue = 'UN_FINISH';
            display = STATUS_STORES[statue];
        }

        $scope.STATUS = display;
        $stateParams.status = null;
        var PARAMS = {page: 1};
        if (statue == 'WAIT') {
            PARAMS.isHasBudget = false;
        } else if (statue == 'WAIT_UPLOAD') {
            PARAMS.isUpload = false;
        } else if (statue == 'REJECT') {
            PARAMS.audit = 'N';
        } else {
            PARAMS.isComplete = false;
        }
        //-----------------------------------------------

        //-----------------------------------------------------------
        function init() {
            //页面上的所有交互All interacitve actions on this page
            $scope.$root.pageTitle = '出差记录';
            $scope.$root.pageTitle = "出差记录";
            console.log('--- initial PARAMS',PARAMS);
            $scope.getList(PARAMS);
            $(window).on("scroll", $scope.handleScroll);
            $(".dropdown-header").on("click", $scope.enterSelectingMode);
            $(".veil").on("click", $scope.quitSelectingMode);
        }

        // 进入“选择模式”。该函数在用户点击".dropdown-header"时被调用。
        $scope.enterSelectingMode = function () {
            $(".veil").show();
            $("body").css({overflow: "hidden"});
            $(this).siblings(".dropdown-menu").slideDown();
            $(this).parent(".dropdown").siblings(".dropdown").find(".dropdown-menu").hide();
        }
        $scope.quitSelectingMode = function () {//退出“选择模式”。该函数在用户点击 ".dropdown-menu>li"或".veil" 时被调用。
            $(".veil").hide();
            $(".dropdown-menu").hide();
            $("body").css({overflow: "scroll"});
        }

        $scope.selectStatus = function (i) {//该函数在用户点击 ".dropdown-menu>li" 时被调用。
            $scope.STATUS = $scope.statuses[i];
            $scope.ORDER = "默认";
            $scope.items = [];
            /*
            var storage = {
                incomplete: {page: 1, isComplete: false},
                inAuditing: {page: 1, audit: 'P'},
                rejected: {page: 1, audit: 'N'},
                complete: {page: 1, isComplete: true}
            }
            */
            if ($scope.STATUS === "未完成") {
                PARAMS = {page: 1, isComplete: false};
            } else if ($scope.STATUS === "待出预算") {
                PARAMS = {page: 1, isHasBudget: false};
            } else if ($scope.STATUS === "待预订") {
                PARAMS = {page: 1, orderStatus: "WAIT_BOOK"};
            } else if ($scope.STATUS === "待上传票据") {
                PARAMS = {page: 1, isUpload: false};
            } else if ($scope.STATUS === "票据审核中") {
                PARAMS = {page: 1, audit: 'P'};
            } else if ($scope.STATUS === "审核未通过") {
                PARAMS = {page: 1, audit: 'N'};
            } else if ($scope.STATUS === "已完成") {
                PARAMS = {page: 1, isComplete: true};
            }
            $scope.getList(PARAMS);
            $scope.quitSelectingMode();
        }

        $scope.selectOrder = function (i) {
            $scope.ORDER = $scope.orders[i];
            $scope.items = [];
            PARAMS.page = 1;
            if ($scope.ORDER === "默认") {
                PARAMS.order = null;
            } else if ($scope.ORDER === "预算最大") {
                PARAMS.order = ["budget", "desc"];
            } else if ($scope.ORDER === "预算最小") {
                PARAMS.order = ["budget", "asc"];
            }
            $scope.getList(PARAMS);
            $scope.quitSelectingMode();
        }

        // 该函数用于判断并返回某一条记录的状态。
        // @param {number} i $index
        // @return {string}
        $scope.renderItemStatus = function (i) {
            if ( $scope.items[i].orderStatus==='NO_BUDGET' ) {
                // $scope.items[i].status === -1
                return "待出预算";
            } else if ( $scope.items[i].orderStatus==='WAIT_UPLOAD' ) {
                // $scope.items[i].status === 0 && $scope.items[i].isCommit === false
                return "待上传票据";
            } else if ( $scope.items[i].orderStatus==='WAIT_COMMIT' ) {
                // $scope.items[i].isCommit === true && $scope.items[i].auditStatus === 0
                return "待上传票据";
            } else if ( $scope.items[i].orderStatus==='WAIT_AUDIT' ) {
                // $scope.items[i].isCommit === true && $scope.items[i].auditStatus === 0
                return "票据审核中";
            } else if ( $scope.items[i].orderStatus==='AUDIT_NOT_PASS' ) {
                // $scope.items[i].isCommit === true && $scope.items[i].auditStatus === -1
                return "审核未通过";
            } else if ( $scope.items[i].orderStatus==='COMPLETE' ) {
                // $scope.items[i].status === 2
                return "已完成";
            }
        }

        // 该函数用于计算并返回状态为“已完成”的某条记录的“余额”。
        $scope.renderBalance = function (i) {
            var balance = $scope.items[i].budget - $scope.items[i].expenditure;
            return Math.abs(balance);
        }

        // 该函数用于判断状态为“已完成”的某条记录的支出状况为“节省”还是“超支”。
        // @param {number} i $index
        // @return {string}
        $scope.renderBalanceOrDeficit = function (i) {
            var balance = $scope.items[i].budget - $scope.items[i].expenditure;
            if (balance >= 0) {
                $scope.withBalance = true;
                return "节省";
            } else {
                $scope.withBalance = false;
                return "超支";
            }
        }

        // 该函数用于获取列表并将数据存入$scope.items中。
        // 每执行一次该函数，列表中的记录增加十条。
        $scope.getList = function (p) {
            $loading.start();
            $scope.tips = "正在加载更多...";
            API.onload(function () {
                API.tripPlan
                    .pageTripPlanOrder(p)
                    .then(
                        function (list) {

                            $scope.items = $scope.items.concat(list.items);
                            $scope.total = list.total;
                            p.page++;

                            console.log('---list',$scope.items);

                            // 给$scope.tips重新赋值。
                            if (list.total === 0) {
                                $scope.tips = '<p class="noRecord">没有出差记录</p><p class="seeOtherRecords">点击状态切换查看其他记录！</p>';
                            } else if (list.total <= 10) {
                                $scope.tips = "到底了，没有更多数据了";
                            } else if ($scope.items.length === list.total) {
                                $scope.tips = "到底了，没有更多数据了";
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

                             Promise.all(list.items)
                             .then(function(ret){
                             $scope.planlist = ret;
                             ret.map(function(s){
                             })
                             })
                             .catch(function(err){
                             TLDAlert(err.msg || err)
                             })
                             */
                            $loading.end();
                        }
                    )
                    .catch(function (err) {
                        TLDAlert(err.msg || err)
                    })
            })
        }

        // 该函数在滚动条滚动时被调用。
        $scope.handleScroll = function () {
            // 如果滚动条已经到达页面底部
            if ($(document).scrollTop() == ($(document).height() - $(window).height())) {
                $scope.getList(PARAMS);
            }
        }

        // 该函数将使页面跳转到“详情页”。
        $scope.enterDetail = function (orderId) {
            window.location = "#/travelplan/plandetail?orderId=" + orderId;
        }

        // 初始化页面。
        init();

    }


    /*
     出差单详细
     * @param $scope
     * @constructor
     */
    travelplan.PlandetailController = function ($scope, $stateParams, $loading, FileUploader) {
        //初始化上传图片
        $scope.$root.pageTitle = '详细出差记录';
        $scope.winWidth = $(window).width();
        function uploadInvoice(consumeId, picture, callback) {
            API.tripPlan.uploadInvoice({
                consumeId: consumeId,
                picture: picture
            }, callback);
        }
        $scope.backtraffic_up = '&#xe90e;<em>回程</em><strong>交通票据</strong>';
        $scope.backtraffic_done = function (response) {
            var fileId = response.fileId;
            uploadInvoice($scope.ITEM.backTraffic[0].id, fileId, function (err, result) {
                if (err) {
                    TLDAlert(err.msg || err);
                    return;
                }
                $scope.getData($stateParams.orderId)
                msgbox.log("票据上传成功");
            });
        }
        $scope.outtraffic_up = '&#xe90e;<em>去程</em><strong>交通票据</strong>';
        $scope.outtraffic_done = function (response) {
            console.info(response);
            var fileId = response.fileId;
            uploadInvoice($scope.ITEM.outTraffic[0].id, fileId, function (err, result) {
                if (err) {
                    TLDAlert(err.msg || err);
                    return;
                }
                $scope.getData($stateParams.orderId)
                msgbox.log("票据上传成功");
            });
        }
        $scope.hoteltraffic_up = '&#xe914;<em></em><strong>住宿发票</strong>';
        $scope.hoteltraffic_done = function (response) {
            var fileId = response.fileId;
            uploadInvoice($scope.ITEM.hotel[0].id, fileId, function (err, result) {
                if (err) {
                    TLDAlert(err.msg || err);
                    return;
                }
                $scope.getData($stateParams.orderId)
                msgbox.log("票据上传成功");
            });
        }

        //******************************************************************************
        // @data 该变量的值为  出差记录详情数据。
        $scope.ITEM = {};
        // @data 该变量的值为  预订去程、回程和酒店的url。
        $scope.URL = {};
        // @data 该变量的值为  入住酒店的天数。
        $scope.timeSpan;

        // 此函数用于获取 出差记录详情数据 并把它存入$scope.ITEM这一变量中。
        $scope.getData = function (p) {
            $loading.start();
            API.onload(function () {
                //console.info(p);
                API.tripPlan
                    .getTripPlanOrderById({orderId: p})
                    .then(
                        function (data) {
                            console.log('---details',data);
                            $scope.ITEM = data;
                            console.info (data);
                            //$scope.backId = $scope.ITEM.backTraffic[0].id;
                            //$scope.outId = $scope.ITEM.outTraffic[0].id;
                            //$scope.hotelId = $scope.ITEM.hotel[0].id;

                            $scope.timeSpan = (function () {
                                if ($scope.ITEM.hotel[0]) {
                                    var t1 = $scope.ITEM.hotel[0].startTime;
                                    var t2 = $scope.ITEM.hotel[0].endTime;
                                    t1 = new Date(t1).getTime();
                                    t2 = new Date(t2).getTime();
                                    var timeSpan = (t2 - t1) / 1000 / 60 / 60 / 24;
                                    return timeSpan;
                                }
                            })();
                            $loading.end();
                        }
                    )
                    .catch(function (err) {
                        TLDAlert(err.msg || err)
                    })
            })
        }

        // 此函数用于计算并渲染 节省的钱数/超支的钱数。
        // @return {number}
        $scope.renderDeficit = function () {
            return Math.abs($scope.ITEM.budget - $scope.ITEM.expenditure).toFixed(2);
        }

        // 此函数用于判断并渲染 某一张票据的状态。
        // @param p {string}
        // @param i {number} index
        // @return {string}
        $scope.renderStatus = function (p, i) {

            if (p) {
                if (p.orderStatus === "NO_BUDGET") {
                    return "待出预算";
                } else if (p.orderStatus === "WAIT_BOOK") {
                    return '待预订';
                } else if (p.orderStatus === "WAIT_UPLOAD") {
                    return "待上传票据";
                } else if (p.orderStatus === "AUDIT_NOT_PASS") {
                    return "审核未通过";
                } else if (p.orderStatus === "WAIT_COMMIT") {
                    return "已上传";
                } else if (p.orderStatus === "WAIT_AUDIT") {
                    return "票据审核中";
                } else if (p.orderStatus === "AUDIT_PASS") {
                    return "已完成";
                }
                ;
            }
            ;
        }

        // 此函数用于判断并渲染 “提交审核”按钮上显示的文字。
        // @return {string}
        $scope.renderBUTTON = function () {

            if ($scope.ITEM.orderStatus === "WAIT_AUDIT") {
                return "票据审核中";
            } else {
                return "提交审核";
            }
            ;
        }

        /*
        // 此函数在用户点击“预订”按钮时被调用。
        $scope.book = function (p) {
           if (p === "outTraffic") {
               API.onload(function () {
                    // 获取预订去程的机票或火车票的网页的URL
                    if ($scope.ITEM.outTraffic.length !== 0) {
                       var type = "air";
                       if ($scope.ITEM.outTraffic[0].invoiceType === 'TRAIN') {
                           type = "train";
                       }
                       API.travelBudget.getBookListUrl({
                               spval: $scope.ITEM.outTraffic[0].startPlace,
                               epval: $scope.ITEM.outTraffic[0].arrivalPlace,
                               st: $scope.ITEM.outTraffic[0].startTime,
                               type: type
                           })
                           .then(function (outTrafficBookListUrl) {
                               $scope.URL.outTrafficBookListUrl = outTrafficBookListUrl;
        
                               //$scope.$apply();
        
                               window.location.href = $scope.URL.outTrafficBookListUrl;
                           })
                           .catch(function (err) {
                               TLDAlert(err.msg || err);
                           })
                   }
               });
           } else if (p === "backTraffic") {
               if ($scope.ITEM.backTraffic.length !== 0) {
                   var type = "air";
                   if ($scope.ITEM.backTraffic[0].invoiceType === 'TRAIN') {
                       type = "train";
                   }
                   API.travelBudget.getBookListUrl({
                           spval: $scope.ITEM.backTraffic[0].startPlace,
                           epval: $scope.ITEM.backTraffic[0].arrivalPlace,
                           st: $scope.ITEM.backTraffic[0].startTime,
                           type: type
                       })
                       .then(function (backTrafficBookListUrl) {
                           $scope.URL.backTrafficBookListUrl = backTrafficBookListUrl;
        
                           //$scope.$apply();
        
                           window.location.href = $scope.URL.backTrafficBookListUrl;
                       })
                       .catch(function (err) {
                           TLDAlert(err.msg || err);
                       })
               }
           } else if (p === "hotel") {
               if ($scope.ITEM.hotel.length !== 0) {
                   API.travelBudget.getBookListUrl({
                           hotelCity: $scope.ITEM.hotel[0].city,
                           hotelAddress: $scope.ITEM.hotel[0].hotelName,
                           from: 'mobile',
                           hotelSt: $scope.ITEM.hotel[0].startTime,
                           hotelEt: $scope.ITEM.hotel[0].endTime,
                           type: 'hotel'
                       })
                       .then(function (r) {
                           $scope.URL.hotelBookListUrl = r;
        
                           //$scope.$apply();
        
                           console.log($scope.URL.hotelBookListUrl);
                           window.location.href = $scope.URL.hotelBookListUrl;
                       })
                       .catch(function (err) {
                           TLDAlert(err.msg || err);
                       })
               }
           }
           ;
        }
        */

        // 此函数在用户点击“查看票据”按钮时被调用。
        $scope.checkInvoice = function (p) {
            if (p === "outTraffic") {
                window.location.href = "#/travelplan/invoicedetail?planId=" + $scope.ITEM.id + "&status=" + p + "&invoiceId=" + $scope.ITEM.outTraffic[0].newInvoice;
            } else if (p === "backTraffic") {
                window.location.href = "#/travelplan/invoicedetail?planId=" + $scope.ITEM.id + "&status=" + p + "&invoiceId=" + $scope.ITEM.backTraffic[0].newInvoice;
            } else if (p === "hotel") {
                window.location.href = "#/travelplan/invoicedetail?planId=" + $scope.ITEM.id + "&status=" + p + "&invoiceId=" + $scope.ITEM.hotel[0].newInvoice;
            }
            ;
        }

        // 此函数在用户点击“提交审核”按钮时被调用。
        $scope.commit = function () {
            if ($scope.ITEM.orderStatus === "WAIT_COMMIT") {
                msgbox.confirm('票据一经提交将无法进行修改，是否确认提交？', '确认提交', '返回检查')
                    .then(function (btn) {
                        if (btn != 'ok')
                            return;
                        API.onload(function () {
                            API.tripPlan.commitTripPlanOrder($scope.ITEM.id)
                                .then(function (result) {
                                    $scope.getData($stateParams.orderId);

                                    //$scope.$apply();

                                    msgbox.log("提交审核成功");
                                })
                                .catch(function (err) {
                                    $(".confirmFixed").show();
                                    console.info(err);
                                });
                        })
                    });
            }
            ;
        }

        // 此函数被用于初始化页面。
        function init() {
            $scope.$root.pageTitle = "详细出差记录";
            $scope.getData($stateParams.orderId);
        }

        //----------------------------------------------------------------
        init();

    }


    /*
     行程单详细
     * @param $scope
     * @constructor
     */
    travelplan.InvoicedetailController = function ($scope, $stateParams) {

        $scope.$root.pageTitle = '票据详情';

        var planId = $stateParams.planId;
        $scope.planId = planId;
        $scope.status = $stateParams.status;
        $scope.invoiceId = $stateParams.invoiceId;
        API.require("attachment");

        $scope.goDetail = function () {
            window.location.href = "#/travelplan/plandetail?planId=" + planId;
        }
        return API.onload()
            .then(function () {
                return API.tripPlan.getTripPlanOrderById({orderId: planId});
            })
            .then(function (result) {
                var InvoiceDetail;
                $scope.planDetail = result;

                if ($scope.status == 'outTraffic') {
                    InvoiceDetail = result.outTraffic[0];
                }
                if ($scope.status == 'backTraffic') {
                    InvoiceDetail = result.backTraffic[0];
                }
                if ($scope.status == 'hotel') {
                    InvoiceDetail = result.hotel[0];
                }
                return InvoiceDetail;
            })
            .then(function (invoiceDetail) {
                $scope.InvoiceDetail = invoiceDetail;
                return API.attachment.previewSelfImg({fileId: invoiceDetail.newInvoice})
            })
            .then(function (invoiceImg) {
                $scope.invoiceImg = invoiceImg;
            })
            .catch(function (err) {
                TLDAlert(err.msg || err);
            });
    }


    return travelplan;
})();

module.exports = travelplan;