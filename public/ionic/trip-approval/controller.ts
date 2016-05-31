/**
 * Created by seven on 16/4/25.
 */
"use strict";
import { Models } from 'api/_types';
import {TripDetail, EPlanStatus, ETripType, EInvoiceType, EAuditStatus} from "api/_types/tripPlan";
import {Staff} from "api/_types/staff";

export function ApprovedController($scope){

}

export function DetailController($scope){

}

export async function ListController($scope, Models){
    let staff = await Staff.getCurrent();
    let tripPlans = await staff.getWaitApproveTripPlans({}); //获取待审批出差计划列表
    $scope.tripPlans = tripPlans;

    $scope.enterDetail = function(tripid){
        window.location.href = "#/trip/list-detail?tripid="+tripid;
    }
}

export async function PendingController($scope){
    let staff = await Staff.getCurrent();
    let tripPlans = await staff.getTripPlans({where: {auditStatus: EAuditStatus.AUDITING}}); //获取待审批出差计划列表
    $scope.tripPlans = tripPlans;

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