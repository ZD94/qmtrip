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
    if(tripPlan.status != EPlanStatus.WAIT_APPROVE) {
        alert('不是待审批出差计划');
        return;
    }
    $scope.tripPlan = tripPlan;
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

export async function ListController($scope, Models){
    let staff = await Staff.getCurrent();
    let tripPlans = await staff.getWaitApproveTripPlans({}); //获取待审批出差计划列表
    $scope.tripPlans = tripPlans;
    $scope.hasNextPage = true;

    $scope.loadMore = function() {
        try {
            $scope.tripPlans = $scope.tripPlans.nextPage();
            $scope.hasNextPage = true;
        } catch(err) {
            $scope.tripPlans = [];
            $scope.hasNextPage = false;
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