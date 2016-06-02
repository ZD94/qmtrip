/**
 * Created by seven on 16/4/25.
 */
"use strict";
import {EPlanStatus, ETripType, EAuditStatus} from "api/_types/tripPlan";
import {Staff} from "api/_types/staff";
import moment = require('moment');

export async function ApprovedController($scope, Models, $stateParams){
    let staffId = $stateParams.staffId;
    let staff = await Models.staff.get(staffId);
    $scope.staffName = staff.name;
}

export async function DetailController($scope, Models, $stateParams){
    require('./detail.less');
    let tripId = $stateParams.tripid;
    let tripPlan = await Models.tripPlan.get(tripId);
    $scope.tripPlan = tripPlan;
    console.info(tripPlan);
    let staff = await Models.staff.get(tripPlan.accountId);
    $scope.staff = staff;
    console.info(staff);
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

    $scope.approve = async function(result: EAuditStatus) {
        try{
            await tripPlan.approve({auditResult: result});
            if(result == EAuditStatus.PASS) {
                window.location.href = "#/trip-approval/approved?staffId="+tripPlan.account.id;
            }
        }catch (e) {
            alert(e);
        }
    }
}

export async function ListController($scope, Models, $stateParams, $ionicLoading){
    let staff = await Staff.getCurrent();
    const ONE_PAGE_LIMIT = 10;
    let Pager;
    $scope.filter = 'WAIT_APPROVE';
    $scope.tripPlans = [];
    $scope.changeTo = async function(filter) {
        $scope.tripPlans = [];
        if (['WAIT_APPROVE', 'ALL', 'APPROVE_PASS', 'APPROVE_FAIL'].indexOf(filter) >= 0) {
            $scope.filter = filter;
        }
        let status: string|number = 'ALL';
        switch(filter) {
            case 'WAIT_APPROVE':
                status = EPlanStatus.WAIT_APPROVE;
                break;
            case 'APPROVE_PASS':
                status = EPlanStatus.WAIT_UPLOAD;
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
    let staff = await Staff.getCurrent();
    let tripPlans = await staff.getTripPlans({where: {status: [EPlanStatus.WAIT_APPROVE, EPlanStatus.APPROVE_NOT_PASS]}}); //获取待审批出差计划列表
    $scope.tripPlans = tripPlans;
    $scope.EPlanStatus = EPlanStatus;
    
    $scope.enterDetail = function(tripid){
        window.location.href = "#/trip/list-detail?tripid="+tripid;
    }
}

export function RejectReasonController($scope){

}

export function RejectedController($scope){

}

export function SupervisorSelectorController($scope){

}