/**
 * Created by seven on 16/4/25.
 */
"use strict";
import {EPlanStatus, ETripType, EAuditStatus} from "api/_types/tripPlan";
import {Staff} from "api/_types/staff";
import moment = require('moment');
const API = require("common/api")

export async function ApprovedController($scope, Models, $stateParams){
    let staffId = $stateParams.staffId;
    let staff = await Models.staff.get(staffId);
    $scope.staffName = staff.name;
}

export async function DetailController($scope, Models, $stateParams, $ionicPopup, $ionicLoading){
    require('./detail.less');
    let tripId = $stateParams.tripid;
    let tripPlan = await Models.tripPlan.get(tripId);
    if (!tripPlan.isFinalBudget && tripPlan.status == EPlanStatus.WAIT_APPROVE) {
        await $ionicLoading.show({
            template: '预算重新计算中...'
        });
        //计算最终预算
        API.require("tripPlan");
        await API.onload();
        await API.tripPlan.makeFinalBudget({tripPlanId: tripId});
        await $ionicLoading.hide();
    }

    $scope.tripPlan = tripPlan;
    let staff = await Models.staff.get(tripPlan.accountId);
    $scope.staff = staff;
    let tripDetails = await tripPlan.getTripDetails();
    let traffic = [], hotel = [];
    let trafficBudget = 0, hotelBudget = 0, subsidyBudget = 0;
    tripDetails.map(function(detail) {
        switch (detail.type) {
            case ETripType.OUT_TRIP:
            case ETripType.BACK_TRIP:
                traffic.push(detail);
                trafficBudget += detail.budget;
                break;
            case ETripType.HOTEL:
                hotel.push(detail);
                hotelBudget += detail.budget;
                break;
            default: subsidyBudget += detail.budget; break;
        }
    });
    let subsidyDays:number = moment(tripPlan.backAt.value).diff(moment(tripPlan.startAt.value), 'days');
    $scope.traffic = traffic;
    $scope.hotel = hotel;
    $scope.trafficBudget = trafficBudget;
    $scope.hotelBudget = hotelBudget;
    $scope.subsidyBudget = subsidyBudget;
    $scope.subsidyDays = subsidyDays;
    $scope.approveResult = EAuditStatus;
    $scope.EPlanStatus = EPlanStatus;

    async function approve(result: EAuditStatus, auditRemark?: string) {
        try{
            await tripPlan.approve({auditResult: result, auditRemark: auditRemark});
            if(result == EAuditStatus.PASS) {
                window.location.href = "#/trip-approval/approved?staffId="+tripPlan.account.id;
            }
        }catch (e) {
            alert(e);
        }
    }

    $scope.showReasonDialog = function () {
        $scope.reject = {reason: ''};
        $ionicPopup.show({
            template: '<input type="text" ng-model="reject.reason">',
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
        $scope.reject = {reason: ''};
        $ionicPopup.show({
            title: '确认同意',
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
    require('./detail.less');
    let staff = await Staff.getCurrent();
    const ONE_PAGE_LIMIT = 10;
    let Pager;
    $scope.filter = 'WAIT_APPROVE';
    $scope.EPlanStatus = EPlanStatus;
    $scope.tripPlans = [];
    $scope.changeTo = async function(filter) {
        $scope.tripPlans = [];
        if (['WAIT_APPROVE', 'ALL', 'APPROVE_PASS', 'APPROVE_FAIL'].indexOf(filter) >= 0) {
            $scope.filter = filter;
        }
        let status: string|number|Object = 'ALL';
        switch(filter) {
            case 'WAIT_APPROVE':
                status = EPlanStatus.WAIT_APPROVE;
                break;
            case 'APPROVE_PASS':
                status = [EPlanStatus.WAIT_UPLOAD, EPlanStatus.AUDITING, EPlanStatus.COMPLETE, EPlanStatus.WAIT_COMMIT, EPlanStatus.AUDIT_NOT_PASS];
                break;
            case 'APPROVE_FAIL':
                status = EPlanStatus.APPROVE_NOT_PASS;
                break;
        }
        let where: any = {};
        if (status != 'ALL') {
            where.status = status;
        }
        Pager = await staff.getWaitApproveTripPlans({ where: where, limit: ONE_PAGE_LIMIT}); //获取待审批出差计划列表
        $scope.Pager = Pager;
        Pager.forEach(function(v) {
            $scope.tripPlans.push(v);
        })
        //首次加载判断
        if (!Pager.length) {
            $scope.hasNextPage = false;
        } else {
            $scope.hasNextPage = true;
        }
    }
    $scope.changeTo($scope.filter);
    $scope.hasNextPage = true;
    $scope.loadMore = async function() {
        if (!$scope.Pager) {
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
        }
        try {
            Pager = await $scope.Pager.nextPage();
            Pager.forEach(function(v) {
                $scope.tripPlans.push(v);
            });
            $scope.Pager = Pager;
            $scope.hasNextPage = true;
        } catch(err) {
            console.info(err);
            $scope.hasNextPage = false;
        } finally {
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    }

    $scope.enterDetail = function(tripid){
        window.location.href = "#/trip-approval/detail?tripid="+tripid;
    }
}

export async function PendingController($scope){
    const PAGE_SIZE = 10;
    let staff = await Staff.getCurrent();
    let Pager = await staff.getTripPlans({where: {status: [EPlanStatus.WAIT_APPROVE, EPlanStatus.APPROVE_NOT_PASS]}, limit: PAGE_SIZE}); //获取待审批出差计划列表
    $scope.tripPlans = [];

    Pager.forEach((v) => {
        $scope.tripPlans.push(v);
    })
    $scope.Pager = Pager;
    $scope.EPlanStatus = EPlanStatus;
    
    $scope.enterDetail = function(tripid){
        window.location.href = "#/trip/list-detail?tripid="+tripid;
    }

    if (!Pager || !Pager.length) {
        $scope.hasNextPage = false;
    } else {
        $scope.hasNextPage = true;
    }
    $scope.loadMore = async function() {
        if (!$scope.Pager) {
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
        }
        try {
            $scope.Pager = await $scope.Pager.nextPage();
            $scope.Pager.map(function(v) {
                $scope.tripPlans.push(v);
            })
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