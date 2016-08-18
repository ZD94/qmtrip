/**
 * Created by seven on 16/4/25.
 */
"use strict";
import {ETripType, EAuditStatus, EInvoiceType, MTxPlaneLevel, EApproveStatus} from "api/_types/tripPlan";
import {MHotelLevel, MPlaneLevel, MTrainLevel} from "api/_types/travelPolicy";
import {Staff} from "api/_types/staff";
import moment = require('moment');
const API = require("common/api")
let APPROVE_TEXT: any = {};
APPROVE_TEXT[EApproveStatus.CANCEL] = '已撤销';
APPROVE_TEXT[EApproveStatus.NO_BUDGET] = '没有预算';
APPROVE_TEXT[EApproveStatus.PASS] = '审批通过';
APPROVE_TEXT[EApproveStatus.REJECT] = '审批驳回';
APPROVE_TEXT[EApproveStatus.WAIT_APPROVE] = '等待审批';

export async function ApprovedController($scope, Models, $stateParams){
    let staffId = $stateParams.staffId;
    let staff = await Models.staff.get(staffId);
    $scope.staffName = staff.name;
}

export async function DetailController($scope, Models, $stateParams, $ionicPopup, $loading){
    require('./trip-approval.scss');
    let approveId = $stateParams.approveId;
    let tripApprove = await Models.tripApprove.get(approveId);
    $scope.staff = tripApprove.account;
    APPROVE_TEXT[EApproveStatus.WAIT_APPROVE] = `等待 ${tripApprove.approveUser.name} 审批`;
    $scope.APPROVE_TEXT = APPROVE_TEXT;

    //判断有无审批权限
    let isHasPermissionApprove = false;
    let curStaff = await Staff.getCurrent();
    if(tripApprove.approveUser && curStaff.id == tripApprove.approveUser.id) { isHasPermissionApprove = true;}
    $scope.isHasPermissionApprove = isHasPermissionApprove;
    let totalBudget: number = 0;

    if (tripApprove.status == EApproveStatus.WAIT_APPROVE && tripApprove.query && isHasPermissionApprove) {
        $loading.reset();
        $loading.start({
            template: '预算计算中...'
        });
        //计算最终预算
        API.require("travelBudget");
        await API.onload();
        let query = tripApprove.query;

        if (typeof query == 'string')
            query = JSON.parse(tripApprove.query);

        query.staffId = tripApprove.account.id;
        let budgetId = await API.travelBudget.getTravelPolicyBudget(query);
        $scope.budgetId = budgetId;
        let budgetInfo = await API.travelBudget.getBudgetInfo({id: budgetId, accountId: tripApprove.account.id});
        let budgets = budgetInfo.budgets;

        totalBudget = 0;
        budgets.forEach((v) => {
            if (v.price <= 0) {
                totalBudget = -1;
                return;
            }
            totalBudget += Number(v.price);
        });

        if (totalBudget > tripApprove.budget) {
            tripApprove.budget = totalBudget;
            tripApprove.budgetInfo = budgets;
        }
    }

    let traffic = [], hotel = [], subsidy = [];
    let trafficBudget = 0, hotelBudget = 0, subsidyBudget = 0;
    let subsidyDays:number = moment(tripApprove.backAt).diff(moment(tripApprove.startAt), 'days');
    tripApprove.budgetInfo.map((budget) => {
        budget.startTime = tripApprove.startAt;
        budget.endTime = tripApprove.backAt;
        switch (budget.tripType) {
            case ETripType.OUT_TRIP:
                budget.deptCity = tripApprove.deptCity;
                budget.arrivalCity = tripApprove.arrivalCity;
                traffic.push(budget);
                trafficBudget += Number(budget.price);
                break;
            case ETripType.BACK_TRIP:
                budget.deptCity = tripApprove.arrivalCity;
                budget.arrivalCity = tripApprove.deptCity;
                budget.startTime = tripApprove.backAt;
                budget.endTime = tripApprove.startAt;
                traffic.push(budget);
                trafficBudget += Number(budget.price);
                break;
            case ETripType.HOTEL:
                budget.city = tripApprove.arrivalCity;
                hotel.push(budget);
                hotelBudget += Number(budget.price);
                break;
            case ETripType.SUBSIDY: subsidy.push(budget); subsidyBudget += Number(budget.price); break;
        }
    });

    $scope.tripApprove = tripApprove;
    $scope.traffic = traffic;
    $scope.hotel = hotel;
    $scope.subsidy = subsidy;
    $scope.trafficBudget = trafficBudget;
    $scope.hotelBudget = hotelBudget;
    $scope.subsidyBudget = subsidyBudget;
    $scope.subsidyDays = subsidyDays;
    $scope.EInvoiceType = EInvoiceType;
    $scope.EApproveStatus = EApproveStatus;
    $scope.MTxPlaneLevel = MTxPlaneLevel;

    $loading.end();


    async function approve(result: EAuditStatus, auditRemark?: string) {
        try{
            await tripApprove.approve({auditResult: result, auditRemark: auditRemark, budgetId: $scope.budgetId});
            if(result == EAuditStatus.PASS) {
                window.location.href = "#/trip-approval/approved?staffId="+tripApprove.account.id;
            }
        }catch (e) {
            alert(e);
        }
    }

    $scope.showTravelPolicy = async function (staffId) {
        var staff = await Models.staff.get(staffId);
        if (!staff){
            return;
        }
        var policy = await staff.getTravelPolicy();
        if (policy) {   //判断是否设置差旅标准
            var show = $ionicPopup.alert({
                title: '差旅标准',
                template: '飞机:' + MPlaneLevel[policy.planeLevel] +
                '<br>' +
                '火车:' + MTrainLevel[policy.trainLevel] +
                '<br>' +
                '住宿:' + MHotelLevel[policy.hotelLevel] +
                '<br>' +
                '补助:' + policy.subsidy + '/天'
            })
        } else {
            var show = $ionicPopup.alert({   //定义show的原因是避免页面加载就执行
                title: '提示',
                template: '暂未设置差旅标准,请设置后查看'
            })
        }
    };

    $scope.showReasonDialog = function () {
        $scope.reject = {reason: ''};
        $scope.reasonItems = ['重新安排时间','计划临时取消','预算不符合要求'];
        $scope.showReasons = false;
        $scope.chooseReason = function (item){
            $scope.reject = {reason: item};
            $scope.showReasons = false;
        };
        $scope.showList = function (){
            $scope.showReasons = true;
        };
        $scope.hideList = function (){
            $scope.showReasons = false;
        };
        $ionicPopup.show({
            template: '<input type="text" ng-model="reject.reason" ng-focus="showList()" ng-keydown="hideList()"  placeholder="请输入或选择拒绝理由" style="border: 1px solid #ccc;padding-left: 10px;">' +
            '<ion-list ng-if="showReasons"> ' +
            '<ion-item ng-repeat="item in reasonItems  track by $index" ng-click="chooseReason(item)" style="border: none;line-height: 6px;">{{item}}</ion-item> ' +
            '</ion-list>',
            title: '填写拒绝原因',
            scope: $scope,
            buttons: [{
                text: '取消'
            },{
                text: '确认',
                type: 'button-positive',
                onTap: async function (e) {
                    if (!$scope.reject.reason) {
                        e.preventDefault();
                    } else {
                        approve(EAuditStatus.NOT_PASS, $scope.reject.reason);
                    }
                }
            }]
        })
    };

    $scope.showAlterDialog = function () {
        $scope.isNextApprove = false;

        $scope.chooseOption = function(isNextApprove) {
            $scope.isNextApprove = isNextApprove;
        };

        $scope.staffSelector = {
            query: async function(keyword) {
                let staff = await Staff.getCurrent();
                let staffs = await staff.company.getStaffs({where: {id: {$ne: staff.id}}});
                return staffs;
            },
            display: (staff)=>staff.name
        };

        $ionicPopup.show({
            title: '确认同意',
            template: `<ion-list show-delete="false">
                             <ion-item ng-click="chooseOption(false)" ng-class="{true: '', false: 'item-option-selected'}[isNextApprove]">直接同意</ion-item>
                             <ion-item ng-click="chooseOption(true)" ng-class="{true: 'item-option-selected', false: ''}[isNextApprove]" style="border-top: 1px #387ef5 solid">
                                <span class="input-label">同意并转给</span>
                                    <ng-selector-list style="float: right;"
                                        ng-model="tripApprove.approveUser"
                                        dlg-options="staffSelector"
                                        dlg-title="选择审批人"
                                        dlg-placeholder="请选择审批人"
                                        class="fake-input">
                                    </ng-selector-list>
                            </ion-item>
                       </ion-list>`,
            scope: $scope,
            buttons: [{
                text: '取消'
            },{
                text: '确认',
                type: 'button-positive',
                onTap: async function (e) {
                    approve(EAuditStatus.PASS);
                }
            }]
        })
    };
}

export async function ListController($scope, Models, $stateParams, $ionicLoading){
    require('./trip-approval.scss');
    let staff = await Staff.getCurrent();
    const ONE_PAGE_LIMIT = 10;
    let Pager;
    $scope.filter = 'WAIT_APPROVE';
    $scope.EApproveStatus = EApproveStatus;
    $scope.tripApproves = [];
    $scope.APPROVE_TEXT = APPROVE_TEXT;
    
    $scope.changeTo = async function(filter) {
        $scope.tripApproves = [];
        if (['WAIT_APPROVE', 'ALL', 'APPROVE_PASS', 'APPROVE_FAIL'].indexOf(filter) >= 0) {
            $scope.filter = filter;
        }
        let status: string|number|Object = 'ALL';
        switch(filter) {
            case 'WAIT_APPROVE': status = EApproveStatus.WAIT_APPROVE; break;
            case 'APPROVE_PASS': status = EApproveStatus.PASS; break;
            case 'APPROVE_FAIL': status = EApproveStatus.REJECT; break;
        }
        let where: any = {};
        if (status != 'ALL') where.status = status;
        Pager = await staff.getTripApprovesByApproverUser({ where: where, limit: ONE_PAGE_LIMIT}); //获取待审批出差计划列表
        Pager.forEach(function(v) {
            $scope.tripApproves.push(v);
        })
    };

    $scope.hasNextPage = function() : Boolean{
        if (!Pager) return false;
        return Pager.totalPages - 1 > Pager.curPage;
    };

    await $scope.changeTo($scope.filter);
    
    $scope.loadMore = async function() {
        if (!Pager) {
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
        }
        try {
            Pager = await Pager.nextPage();
            Pager.forEach(function(v) {
                $scope.tripApproves.push(v);
            });
        } catch(err) {
            alert("加载数据发生错误");
        } finally {
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    };

    $scope.enterDetail = function(approveId){
        if (!approveId) return;
        window.location.href = `#/trip-approval/detail?approveId=${approveId}`;
    }
}

export async function PendingController($scope){
    const PAGE_SIZE = 10;
    let staff = await Staff.getCurrent();
    let tripApproves = [];
    let Pager = await staff.getTripApproves({where: {status: [EApproveStatus.CANCEL, EApproveStatus.PASS, EApproveStatus.REJECT, EApproveStatus.WAIT_APPROVE]}, limit: PAGE_SIZE})
    $scope.hasNextPage = (!Pager || !Pager.length) ? false : true;
    Pager.forEach((a) => {tripApproves.push(a);});
    $scope.tripApproves = tripApproves;
    $scope.Pager = Pager;
    $scope.EApproveStatus = EApproveStatus;
    console.info($scope.tripApproves);

    $scope.enterDetail = function(approveId){
        window.location.href = `#/trip-approval/detail?approveId=${approveId}`;
    };

    $scope.loadMore = async function() {
        if (!$scope.Pager) {
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
        }
        try {
            $scope.Pager = await $scope.Pager.nextPage();
            $scope.Pager.map(function(v) {
                $scope.tripApproves.push(v);
            });
            $scope.hasNextPage = true;
        } catch (err) {
            $scope.hasNextPage = false;
        } finally {
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    }
}

export function RejectReasonController($scope){

}

export function RejectedController($scope){

}

export function SupervisorSelectorController($scope){

}