/**
 * Created by seven on 16/7/4.
 */
"use strict";

const API = require("common/api");
var msgbox = require('msgbox');


/*
 出差单列表
 * @param $scope
 * @constructor
 */
export async function TravelListController($scope, Models, $stateParams){
    var status = $stateParams.status;
    $("title").html("出差单列表");
    $scope.status = status || 'all';
    $scope.pager;
    $scope.tripPlans = [];
    $scope.init = function (status) {
        if (status == $scope.status) return;
        if (status) {
            $scope.status = status;
        }
        var where :any = {};
        if (status == 'no_budget') {
            where.status = -1;
        } else if (status == 'wait_approve') {
            where.status = 3;
        } else {
            where.status = [-3, -1, 3, 4];
        }
        Models.tripPlan.find({where: where})
            .then(function (pager) {
                $scope.pager = pager;
                return Promise.all(pager.map((item)=> {
                    return item.getCompany()
                        .then(function (company) {
                            item.company = company;
                            return item;
                        })
                }));
            })
            .then(function (tripPlans) {
                $scope.tripPlans = tripPlans;
            })
            .catch(function(err){
                msgbox.log(err.msg ||err);
            }).done();
    }

    $scope.nextPage = function () {
        $scope.pager = $scope.pager.nextPage();
    }

    $scope.init(status);
}

/*
 出差单详细
 * @param $scope
 * @constructor
 */
export async function TravelDetailController($scope, $stateParams, $location, $anchorScroll, Models){
    $("title").html("出差单明细");
    var orderId = $stateParams.orderId;
    $scope.showInvoiceFailDialog = false;
    $scope.showInvoicePassDialog = false;
    $scope.curTripDetail = null;
    $scope.expenditure = '';
    $scope.failReason = '图片不清楚';

    $scope.reasons = ['图片不清楚', '所传单据和出差记录不符']
    $scope.setFailReason = function (reason) {
        $scope.failReason = reason;
    }

    $scope.init = function () {
        Models.tripPlan.get(orderId)
            .then(function (tripPlan) {
                $scope.tripPlan = tripPlan;
                //获取出差预算列表
                return tripPlan.getTripDetails({where: {}})
                    .then(function (tripDetails) {
                        //对出差单进行排序,按照类型
                        tripDetails.sort(function (v1, v2) {
                            if (v1.type == 0) return -1;
                            if (v2.type == 0) return 1;
                            if (v1.type == 2) return -1;
                            if (v2.type == 2) return 1;
                            if (v1.type == 1) return -1;
                            if (v2.type == 1) return 1;
                            return v1.type - v2.type;
                        });
                        $scope.tripDetails = tripDetails;
                    })
            })
            .catch(function(err){
                msgbox.log(err.msg ||err);
            }).done();
    }
    $scope.init();

    //默认不显示审批对话框
    $scope.showInvoice = function (tripDetailId) {
        Models.tripDetail.get(tripDetailId)
            .then(function (tripDetail) {
                if (tripDetail.invoice && typeof tripDetail.invoice == 'string') {
                    tripDetail.invoice = JSON.parse(tripDetail.invoice);
                }
                $scope.curTripDetail = tripDetail;
                $scope.curTripDetailInoviceImg = '/consume/invoice/' + tripDetail.id;
                return tripDetail;
            })
            .catch(function(err){
                msgbox.log(err.msg ||err);
            }).done();
    }

    $scope.closePassFailDialog = function () {
        $scope.showInvoicePassFailDialog = false;
    };
    $scope.invoiceNopassShow = function (tripDetailId) {
        $scope.showInvoicePassDialog = false;
        $scope.showInvoicePassFailDialog = true;
    }

    //审批通过
    $scope.invoicePassShow = function (tripDetailId) {
        $scope.showInvoicePassFailDialog = false;
        $scope.showInvoicePassDialog = true;
    }
    //关闭审批通过对话框
    $scope.closePassDialog = function () {
        $scope.showInvoicePassDialog = false;
    }

    $scope.approvePass = function () {
        if (!$scope.expenditure || !/^\d+(\.\d{1,2})?$/.test($scope.expenditure)) {
            alert("实际花费格式不正确");
            return false;
        }

        if (confirm("确实要通过审核吗?")) {
            $scope.curTripDetail.auditPlanInvoice({auditResult: 2, expenditure: $scope.expenditure});
            $scope.closePassDialog();
        }
    }

    $scope.approveFail = function () {
        if (confirm('确实要【拒绝】这张票据吗?')) {
            $scope.curTripDetail.auditPlanInvoice({auditResult: -2, reason: $scope.failReason});
            $scope.closePassFailDialog();
        }
    }
}