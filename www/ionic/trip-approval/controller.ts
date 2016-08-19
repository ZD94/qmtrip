/**
 * Created by seven on 16/4/25.
 */
"use strict";
import {EPlanStatus, ETripType, EAuditStatus, EInvoiceType, MTxPlaneLevel} from "api/_types/tripPlan";
import {MHotelLevel, MPlaneLevel, MTrainLevel} from "api/_types/travelPolicy";
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
    let subsidyDays:number = moment(tripPlan.backAt).diff(moment(tripPlan.startAt), 'days');
    let totalBudget: number = 0;
    let budgetId;
    if (tripPlan.status == EPlanStatus.WAIT_APPROVE && tripPlan.query) {
        await $ionicLoading.show({
            template: '预算计算中...'
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

        totalBudget = 0;
        budgets.forEach((v) => {
            if (v.price <= 0) {
                totalBudget = -1;
                return;
            }
            totalBudget += Number(v.price);
        });

        if (totalBudget > tripPlan.budget) {
            let outTraffic: any = {}, backTraffic: any = {}, hotelDetail: any = {};
            tripDetails.map((detail) => {
                switch (detail.type) {
                    case ETripType.OUT_TRIP: outTraffic = detail; break;
                    case ETripType.BACK_TRIP: backTraffic = detail; break;
                    case ETripType.HOTEL: hotelDetail = detail; break;
                    default: break;
                }
            });

            budgets.forEach((v) => {
                switch(v.tripType) {
                    case ETripType.OUT_TRIP:
                    case ETripType.BACK_TRIP:
                        if(v.tripType == 0) {
                            if(Number(totalBudget) > tripPlan.budget){
                                outTraffic.cabinClass = v.cabinClass;
                                outTraffic.invoiceType = v.type;
                                outTraffic.budget = v.price;
                            }
                            traffic.push(outTraffic);
                            trafficBudget += Number(outTraffic.budget);
                        }else if(v.tripType == 1) {
                            if(Number(totalBudget) > tripPlan.budget){
                                backTraffic.cabinClass = v.cabinClass;
                                backTraffic.invoiceType = v.type;
                                backTraffic.budget = v.price;
                            }
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
            totalBudget = Number(totalBudget) > tripPlan.budget ? totalBudget : tripPlan.budget;

            API.require("place");
            await API.onload();
            let originCity = await API.place.getCityInfo({cityCode: query.originPlace});
            let destinationCity;
            if (query.destinationPlace) {
                destinationCity = await API.place.getCityInfo({cityCode: query.destinationPlace});
            }
            tripDetails = budgets.map( (v) => {
                let ret: any = {
                    budget: v.price,
                    startTime: query.leaveDate,
                    endTime: query.goBackDate,
                    invoiceType: v.type,
                    status: EPlanStatus.WAIT_APPROVE,
                    type: v.tripType,
                    cabinClass: v.cabinClass,
                }

                if (v.tripType == ETripType.OUT_TRIP) {
                    ret.deptCity = originCity.name;
                    ret.arrivalCity = destinationCity.name;
                } else if (v.tripType == ETripType.BACK_TRIP) {
                    ret.startTime = query.goBackDate;
                    ret.deptCity = destinationCity.name;
                    ret.arrivalCity = originCity.name;
                } else if (v.tripType == ETripType.HOTEL) {
                    ret.city = destinationCity.name;
                } else {
                    ret.title = '补助';
                    ret.showBudget = v.price;
                }
                return ret;
            });
        } else {
            //如果总预算<=之前预算,采用之前预算
            totalBudget = tripPlan.budget as number;
            tripDetails.forEach(function(detail) {
                switch (detail.type) {
                    case ETripType.OUT_TRIP:
                        traffic.push(detail);
                        trafficBudget += detail.budget;
                        break;
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
        await $ionicLoading.hide();
    } else {
        //如果不是待审批状态,采用之前预算
        totalBudget = tripPlan.budget as number;
        tripDetails.forEach(function(detail) {
            switch (detail.type) {
                case ETripType.OUT_TRIP:
                    traffic.push(detail);
                    trafficBudget += detail.budget;
                    break;
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

    tripDetails.map( (v) => {
        switch(v.type) {
            case ETripType.BACK_TRIP:
                v.title = ""
                v.showBudget = "";
                break;
            case ETripType.OUT_TRIP:
                v.title = '交通';
                v.showBudget = trafficBudget;
                break;
            case ETripType.HOTEL:
                v.title = '住宿';
                v.showBudget = v.budget;
                break;
            default:
                v.title = '补助';
                v.showBudget = v.budget;
                break;
        }
        return v;
    })

    tripDetails.sort((v1, v2) => {
        return v1.type - v2.type;
    })
    $scope.tripDetails = tripDetails;
    $scope.totalBudget = totalBudget;
    $scope.tripPlan.budget = totalBudget;
    $scope.traffic = traffic;
    $scope.hotel = hotel;
    $scope.trafficBudget = trafficBudget;
    $scope.hotelBudget = hotelBudget;
    $scope.subsidyBudget = subsidyBudget;
    $scope.subsidyDays = subsidyDays;
    $scope.approveResult = EAuditStatus;
    $scope.EPlanStatus = EPlanStatus;
    $scope.EInvoiceType = EInvoiceType;
    $scope.MTxPlaneLevel = MTxPlaneLevel;


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
        Pager.forEach(function(v) {
            $scope.tripPlans.push(v);
        })
    }
    $scope.hasNextPage = function() : Boolean{
        if (!Pager) return false;
        return Pager.totalPages - 1 > Pager.curPage;
    }

    $scope.changeTo($scope.filter);
    $scope.loadMore = async function() {
        if (!Pager) {
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
        }
        try {
            Pager = await Pager.nextPage();
            Pager.forEach(function(v) {
                $scope.tripPlans.push(v);
            });
        } catch(err) {
            alert("加载数据发生错误");
        } finally {
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    }

    $scope.enterDetail = function(trip){
        if (!trip) return;
        window.location.href = "#/trip-approval/detail?tripid="+trip.id;
    }
}

export async function PendingController($scope, $stateParams){
    const PAGE_SIZE = 10;
    let staff = await Staff.getCurrent();
    var status = [];
    if($stateParams.status || $stateParams.status == 0){
        status.push($stateParams.status);
    }else{
        status = [EPlanStatus.WAIT_APPROVE, EPlanStatus.APPROVE_NOT_PASS, EPlanStatus.CANCEL];
    }
    let Pager = await staff.getTripPlans({where: {status: status}, limit: PAGE_SIZE}); //获取待审批出差计划列表
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