/**
 * Created by seven on 16/4/25.
 */
"use strict";
import {
    ETripType, EAuditStatus, EInvoiceType, MTxPlaneLevel, EApproveStatus,
    EApproveResult
} from "api/_types/tripPlan";
import {MHotelLevel, MPlaneLevel, MTrainLevel} from "api/_types/travelPolicy";
import {Staff} from "api/_types/staff";
import moment = require('moment');
import _ = require("lodash")
const API = require("common/api");
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

export async function DetailController($scope, Models, $stateParams, $ionicPopup, $loading, $storage,ngModalDlg){
    require('./trip-approval.scss');
    let approveId = $stateParams.approveId;
    $scope.approveId =approveId;
    let tripApprove = await Models.tripApprove.get(approveId);
    $scope.staff = tripApprove.account;
    $scope.isConfirm = false;
    $scope.APPROVE_TEXT = APPROVE_TEXT;
    $scope.EInvoiceType = EInvoiceType;
    $scope.EApproveStatus = EApproveStatus;
    $scope.MTxPlaneLevel = MTxPlaneLevel;
    $scope.EApproveResult = EApproveResult;

    //判断有无审批权限
    let isHasPermissionApprove = false;
    let curStaff = await Staff.getCurrent();
    if(tripApprove.approveUser && curStaff.id == tripApprove.approveUser.id) {
        isHasPermissionApprove = true;
    }
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
                budget.duringDays = moment(tripApprove.backAt).diff(moment(tripApprove.startAt), 'days');
                hotel.push(budget);
                hotelBudget += Number(budget.price);
                break;
            case ETripType.SUBSIDY:
                budget.duringDays = moment(tripApprove.backAt).diff(moment(tripApprove.startAt), 'days') + 1;
                if (budget.hasFirstDaySubsidy === false) {
                    budget.duringDays -= 1;
                }
                if (budget.hasLastDaySubsidy === false) {
                    budget.duringDays -= 1;
                }
                subsidy.push(budget);
                subsidyBudget += Number(budget.price);
                break;
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
    $loading.end();

    async function approve(result: EApproveResult, approveRemark?: string) {
        try{
            await tripApprove.approve({approveResult: result, isNextApprove: $scope.isNextApprove || false, nextApproveUserId: tripApprove.approveUser.id, approveRemark: approveRemark, budgetId: $scope.budgetId});
            if(result == EApproveResult.PASS) {
                $ionicPopup.show({
                    title: '通过申请',
                    scope: $scope,
                    cssClass: 'approvePass' ,
                    template: require('./approvePassTmp.html'),
                    buttons: [{
                        text:'返回',
                        type:'button-positive'
                    }]
                })
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
        $scope.policy = policy;
        $scope.subsidies = await policy.getSubsidyTemplates();
        $scope.MTrainLevel = MTrainLevel;
        $scope.MPlaneLevel = MPlaneLevel;
        $scope.MHotelLevel = MHotelLevel;
        if (policy) {   //判断是否设置差旅标准
            var show = $ionicPopup.alert({
                title: '差旅标准',
                scope: $scope,
                cssClass: 'policyPopup',
                template: require('../policyPopupTemplate.html')
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
                        approve(EApproveResult.REJECT, $scope.reject.reason);
                    }
                }
            }]
        })
    };


    $scope.confirmButton = async function() {
        $scope.staffSelector = {
            query: async function(keyword) {
                let staff = await Staff.getCurrent();
                let approveStaffId = $scope.tripApprove.account.id;
                let staffs = await staff.company.getStaffs({where: {id: {$ne: staff.id}}});
                return staffs;
            },
            display: (staff)=>staff.name
        };
        var value = await ngModalDlg.selectMode($scope,$scope.staffSelector);
        if(value){
            $scope.isNextApprove = value.isNextApprove;
            $scope.isHasPermissionApprove = isHasPermissionApprove;
            approve(value.result);
        }
        // $scope.isConfirm = true;
        // $scope.isNextApprove = false;
        //
        // $scope.chooseOption = function(isNextApprove) {
        //     $scope.isNextApprove = isNextApprove;
        // };
        //
        // $scope.staffSelector = {
        //     query: async function(keyword) {
        //         let staff = await Staff.getCurrent();
        //         let approveStaffId = $scope.tripApprove.account.id;
        //         let staffs = await staff.company.getStaffs({where: {id: {$ne: staff.id}}});
        //         return staffs;
        //     },
        //     display: (staff)=>staff.name
        // };
    };

    $scope.cancelConfirm = function() {
        $scope.isConfirm = false;
        $scope.isNextApprove = false;
    };
    
    $scope.confirmApprove = function() {
        approve(EApproveResult.PASS);
    };

    $scope.reCommitTripApprove = async function() {
        let tripApprove = $scope.tripApprove;
        let tripDetails = $scope.budgets;
        let trip: any = {
            regenerate: true,
            traffic: tripApprove.isNeedTraffic,
            round: tripApprove.isRoundTrip,
            hotel: tripApprove.isNeedHotel,
            beginDate: moment(tripApprove.startAt).toDate(),
            endDate: moment(tripApprove.backAt).toDate(),
            place: {id: tripApprove.arrivalCityCode, name: tripApprove.arrivalCity},
            reasonName: {id: undefined, name: tripApprove.title},
            reason: tripApprove.title,
            hotelPlaceObj: {}
        };
        // trip.hotelPlaceObj.title = trip.hotelPlaceName

        if(tripApprove.isRoundTrip)
            trip.fromPlace = {id: tripApprove.deptCityCode, name: tripApprove.deptCity};

        if(tripApprove.isNeedHotel) {
            trip.hotelPlace = tripApprove.arrivalCityCode || '';
            trip.hotelPlaceName = tripApprove.arrivalCity || '';
        }

        await $storage.local.set('trip', trip);
        window.location.href="#/trip/create";
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
        if (['WAIT_APPROVE', 'ALL', 'APPROVE_PASS', 'APPROVE_FAIL', 'APPROVING'].indexOf(filter) >= 0) {
            $scope.filter = filter;
        }
        let status: string|number|Object = 'ALL';
        switch(filter) {
            case 'WAIT_APPROVE': status = EApproveStatus.WAIT_APPROVE; break;
            case 'APPROVE_PASS': status = EApproveStatus.PASS; break;
            case 'APPROVE_FAIL': status = EApproveStatus.REJECT; break;
            case 'APPROVING': status = EApproveStatus.WAIT_APPROVE; break;
        }
        let where: any = {};
        if (status != 'ALL') where.status = status;
        if(filter == 'ALL' || filter == 'APPROVING')
            where.isApproving = true;
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

export async function PendingController($scope, $stateParams){
    require('./trip-approval.scss');
    const PAGE_SIZE = 10;
    let staff = await Staff.getCurrent();
    let tripApproves = [];
    let Pager = await staff.getTripApproves({where: {status: [EApproveStatus.CANCEL, EApproveStatus.PASS, EApproveStatus.REJECT, EApproveStatus.WAIT_APPROVE]}, limit: PAGE_SIZE})
    $scope.hasNextPage = (!Pager || !Pager.length) ? false : true;
    Pager.forEach((a) => {tripApproves.push(a);});
    $scope.tripApproves = tripApproves;

    $scope.Pager = Pager;
    $scope.filter = 'ALL';
    $scope.EApproveStatus = EApproveStatus;
    $scope.tripApproves = [];

    $scope.changeTo = async function(filter) {
        $scope.tripApproves = [];
        if (['WAIT_APPROVE', 'ALL', 'APPROVE_FAIL'].indexOf(filter) >= 0) {
            $scope.filter = filter;
        }
        let status: any = {$ne: EApproveStatus.CANCEL};
        switch(filter) {
            case 'ALL': status = {$ne: EApproveStatus.CANCEL};break;
            case 'WAIT_APPROVE': status = EApproveStatus.WAIT_APPROVE; break;
            case 'APPROVE_FAIL': status = EApproveStatus.REJECT; break;
        }
        let where: any = {status: status};
        Pager = await staff.getTripApproves({ where: where, limit: PAGE_SIZE}); //获取待审批出差计划列表
        Pager.forEach(function(v) {
            $scope.tripApproves.push(v);
        })
    };

    await $scope.changeTo($scope.filter);

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

export async function ApproveProgressController ($scope, Models, $stateParams){
    require('./approveProgress.scss');
    let approveId = $stateParams.approveId;
    let tripApprove = await Models.tripApprove.get(approveId);
    $scope.tripApprove = tripApprove;
    let APPROVE_LOG_TEXT = {};
    $scope.EApproveStatus = EApproveStatus;
    APPROVE_LOG_TEXT[EApproveResult.AUTO_APPROVE] = '自动通过';
    APPROVE_LOG_TEXT[EApproveResult.PASS] = '审批通过';
    APPROVE_LOG_TEXT[EApproveResult.REJECT] = '审批驳回';
    APPROVE_LOG_TEXT[EApproveResult.WAIT_APPROVE] = '提交审批';
    $scope.APPROVE_LOG_TEXT = APPROVE_LOG_TEXT;
    let logs = await tripApprove.getApproveLogs();
    logs = await Promise.all(logs.map(async (a) => {
        a.staff = await Models.staff.get(a.userId);
        console.log(a.remark);
        console.info(a);
        return a;
    }));
    $scope.logs = logs;
}

export function RejectReasonController($scope){

    // function add($scope, a, b){
    //     return a+b;
    // }
    // if(!(add($scope, 1, 2) === 3)){
    //     throw new Error();
    // }
    // if(!(Function.prototype.call(add, 1, 2) === 3)){
    //     throw new Error();
    // }
    // if(!($injector.invoke(add, null, {$scope: null, a:1, b:2}) === 3)){
    //     throw new Error();
    // }
}

export function RejectedController($scope){

}

export function SupervisorSelectorController($scope){

}