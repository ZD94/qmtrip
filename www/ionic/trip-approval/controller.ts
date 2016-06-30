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
    require('./trip-approval.scss');
    let tripId = $stateParams.tripid;
    let tripPlan = await Models.tripPlan.get(tripId);

    $scope.tripPlan = tripPlan;
    let staff = tripPlan.account; //await Models.staff.get(tripPlan.accountId);
    $scope.staff = staff;
    
    //判断有无审批权限
    let isHasPermissionApprove = false;
    let curStaff = await Staff.getCurrent();
    if(curStaff.id == tripPlan.auditUser) { isHasPermissionApprove = true;}
    $scope.isHasPermissionApprove = isHasPermissionApprove;
    
    let tripDetails = await tripPlan.getTripDetails();
    let traffic = [], hotel = [];
    let trafficBudget = 0, hotelBudget = 0, subsidyBudget = 0;
    let subsidyDays:number = moment(tripPlan.backAt.value).diff(moment(tripPlan.startAt.value), 'days');
    let totalBudget: number = 0;
    let budgetId;
    if (tripPlan.status == EPlanStatus.WAIT_APPROVE && tripPlan.query) {
        await $ionicLoading.show({
            template: '预算重新计算中...'
        });
        //计算最终预算
        API.require("travelBudget");
        await API.onload();
        let query = tripPlan.query;
        if (typeof query == 'string') {
            query = JSON.parse(tripPlan.query);
        }

        query.staffId = tripPlan.accountId;
        budgetId = await API.travelBudget.getTravelPolicyBudget(query);
        let budgetInfo = await API.travelBudget.getBudgetInfo({id: budgetId, accountId: tripPlan.accountId});
        let budgets = budgetInfo.budgets;
        let outTraffic,backTraffic,hotelDetail;
        tripDetails.map((detail) => {
            switch (detail.type) {
                case ETripType.OUT_TRIP: outTraffic = detail; break;
                case ETripType.BACK_TRIP: backTraffic = detail; break;
                case ETripType.HOTEL: hotelDetail = detail; break;
                default: break;
            }
        });

        totalBudget = 0;
        budgets.forEach((v) => {
            if (v.price <= 0) {
                totalBudget = -1;
                return;
            }

            totalBudget += Number(v.price);
        });

        budgets.forEach((v) => {
            switch(v.tripType) {
                case ETripType.OUT_TRIP:
                case ETripType.BACK_TRIP:
                    if(v.tripType == 0) {
                        if(Number(totalBudget) > tripPlan.budget)
                            outTraffic.budget = v.price;
                        traffic.push(outTraffic);
                        trafficBudget += Number(outTraffic.budget);
                    }else if(v.tripType == 1) {
                        if(Number(totalBudget) > tripPlan.budget)
                            backTraffic.budget = v.price;
                        traffic.push(backTraffic);
                        trafficBudget += Number(backTraffic.budget);
                    }
                    break;
                case ETripType.HOTEL:
                    if(Number(totalBudget) > tripPlan.budget)
                        hotelDetail.budget = v.price;
                    hotel.push(hotelDetail);
                    hotelBudget += Number(hotelDetail.budget);
                    break;
                default:
                    subsidyBudget += Number(v.price);
                    break;
            }
        });

        await $ionicLoading.hide();
    } else {
        totalBudget = tripPlan.budget as number;
        tripDetails.forEach(function(detail) {
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
    }

    $scope.totalBudget = totalBudget;
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
            await tripPlan.approve({auditResult: result, auditRemark: auditRemark, budgetId: budgetId});
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
    require('./trip-approval.scss');
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

    Pager.forEach(function(v) {
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