///<reference path="../../../api/_types/tripPlan.ts"/>
"use strict";

import moment = require('moment');
var API = require("common/api");
var Cookie = require('tiny-cookie');
import { Staff } from 'api/_types/staff';
import { Models } from 'api/_types';
import {
    TripDetail, EPlanStatus, ETripType, EInvoiceType
} from "api/_types/tripPlan";


var defaultTrip = {
    beginDate: moment().startOf('day').hour(9).toDate(),
    endDate: moment().startOf('day').hour(18).toDate(),
    place: '',
    reason: '',

    traffic: false,
    fromPlace: '',
    round: false,

    hotel: false,
    hotelPlace: undefined
};
type TripDefine = typeof defaultTrip;
function TripDefineFromJson(obj: any): TripDefine{
    if(obj == undefined)
        return defaultTrip;
    obj.beginDate = new Date(obj.beginDate);
    obj.endDate = new Date(obj.endDate);
    return obj as TripDefine;
}

export function CreateController($scope, $storage){
    let trip;
    try {
        trip= TripDefineFromJson($storage.local.get('trip'));
    } catch(err) {
        trip = {};
    }
    var today = moment();
    if (!trip.beginDate || (new Date(trip.beginDate) < new Date())) {
        trip.beginDate = today.startOf('day').hour(9).toDate();
    }

    if (!trip.endDate || (new Date(trip.beginDate)) >= new Date(trip.endDate)) {
        trip.endDate = moment(trip.beginDate).add(1, 'days').toDate();
    }

    $storage.local.set('trip', trip);
    $scope.trip = trip;
    $scope.$watch('trip', function(){
        $storage.local.set('trip', $scope.trip);
    }, true)

    $scope.calcTripDuration = function(){
        return moment(trip.endDate).diff(trip.beginDate, 'days') || 1;
    }
    $scope.incTripDuration = function(){
        trip.endDate = moment(trip.endDate).add(1, 'days').toDate();
        $scope.$applyAsync();
    }
    $scope.decTripDuration = function(){
        var newDate = moment(trip.endDate).subtract(1, 'days').toDate();
        if(newDate > trip.beginDate){
            trip.endDate = newDate;
            $scope.$applyAsync();
        }
    }

    $scope.queryPlaces = async function(keyword){
        var places = await API.place.queryPlace({keyword: keyword});
        return places.map((place)=>place.name);
    }

    $scope.queryProjects = async function(keyword){
        var staff = await Staff.getCurrent();
        var projects = await Models.project.find({where:{companyId: staff.company.id}});
        return projects.map((project)=>project.name);
    }
    $scope.createProject = async function(name){
    }

    $scope.nextStep = async function() {
        API.require("travelBudget");
        await API.onload();

        let trip = $scope.trip;
        API.travelBudget.getTravelPolicyBudget({
            originPlace: trip.fromPlace,
            destinationPlace: trip.place,
            leaveDate: moment(trip.beginDate).format('YYYY-MM-DD'),
            goBackDate: moment(trip.endDate).format('YYYY-MM-DD'),
            leaveTime: moment(trip.beginDate).format('HH:mm'),
            goBackTime: moment(trip.endDate).format('HH:mm'),
            isRoundTrip: trip.round,
            isNeedHotel: true,
        })
        .then(function(result) {
            window.location.href = "#/trip/budget?id="+result;
        })
        .catch(function(err) {
            alert(err.msg || err);
        })
    }
}

export async function BudgetController($scope, $storage, Models, $stateParams){
    API.require("tripPlan");
    await API.onload();

    var id = $stateParams.id;
    API.require("travelBudget");
    await API.onload();
    let result = await API.travelBudget.getBudgetInfo({id: id});
    let budgets = result.budgets;
    let trip = $storage.local.get("trip");
    trip.beginDate = result.query.leaveDate;
    trip.endDate  = result.query.goBackDate;
    trip.createAt = new Date(result.createAt);
    $scope.trip = trip;
    //补助,现在是0,后续可能会直接加入到预算中
    let otherBudget = {price: 0, type: 'other', tripType: 'other'};
    let isHasOther = false;
    let totalPrice: number = 0;
    for(let budget of budgets) {
        if (budget.tripType == 'other') {
            isHasOther = true;
            break;
        }
    }
    for(let budget of budgets) {
        let price = Number(budget.price);
        if (price <= 0) {
            totalPrice = -1;
            break;
        }
        totalPrice += price
    }

    $scope.totalPrice = totalPrice;
    let duringDays = moment(trip.endDate).diff(moment(trip.beginDate), 'days');
    $scope.duringDays = duringDays;

    if (!isHasOther) {
        budgets.push(otherBudget);
    }
    $scope.budgets = budgets;

    API.require("tripPlan");
    await API.onload();

    $scope.saveTripPlan = function() {
        let params = {
            deptCity: trip.fromPlace,
            arrivalCity: trip.place,
            startAt: trip.beginDate,
            backAt: trip.endDate,
            title: trip.reason,
            remark: trip.reason,
            budgets: budgets,
        }
        API.tripPlan.saveTripPlan(params)
        .then(function(planTrip) {
            window.location.href = '#/trip/committed?id='+planTrip.id;
        })
        .catch(function(err) {
            alert(err.msg || err);
        })
    }
}

export async function CommittedController($scope, $stateParams, Models){
    let id = $stateParams.id;

    let tripPlan = await Models.tripPlan.get(id);
    $scope.tripPlan = tripPlan.target;

    $scope.goToDetail = function() {
        window.location.href = '#/trip/detail?id='+id;
    }
}

export async function DetailController($scope, $stateParams, Models){
    let id = $stateParams.id;
    let tripPlan = await Models.tripPlan.get(id);
    let budgets: any[] = await Models.tripDetail.find({tripPlanId: id});
    budgets = budgets.map(function(budget) {
        let tripType = 'other';
        if (budget.type == 0) {
            tripType = 'goTraffic'
        }
        if (budget.type == 1) {
            tripType = 'backTraffic';
        }
        if (budget.type == 2) {
            tripType = 'hotel';
        }
        let type = 'air';
        if (budget.invoiceType == 0) {
            type = 'train';
        }
        if (budget.invoiceType == 2) {
            type = 'hotel';
        }
        return {id: budget.id, price: budget.budget, tripType: tripType, type: type}
    })

    $scope.trip = tripPlan.target;
    $scope.budgets = budgets;
}

export async function ListController($scope , Models){
    var staff = await Staff.getCurrent();
    let statusTxt = {};
    statusTxt[EPlanStatus.AUDIT_NOT_PASS] = "未通过";
    statusTxt[EPlanStatus.NO_BUDGET] = "没有预算";
    statusTxt[EPlanStatus.WAIT_UPLOAD] = "待上传票据";
    statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交状态";
    statusTxt[EPlanStatus.AUDITING] = "已提交待审核状态";
    statusTxt[EPlanStatus.COMPLETE] = "审核完，已完成状态";
    $scope.statustext = statusTxt;
    // var tripPlans = await Models.tripPlan.find({});
    let tripPlans = await staff.getTripPlans({});
    tripPlans.map(function(trip){
        trip.startAt = moment(trip.startAt).toDate();
        trip.backAt = moment(trip.backAt).toDate();
        return trip;
    });
    $scope.tripPlans = tripPlans;
    console.info(statusTxt);
    console.info($scope.tripPlans);
    $scope.enterdetail = function(tripid){
        window.location.href = "#/trip/listdetail?tripid="+tripid;
    }
}

export async function ListdetailController($scope , Models, $stateParams ,FileUploader ,$state){
    require('./listdetail.less');
    var staff = await Staff.getCurrent();
    let id = $stateParams.tripid;
    let tripPlan = await Models.tripPlan.get(id);
    $scope.tripDetail = tripPlan;
    console.info(tripPlan);
    $scope.createdAt = moment(tripPlan.createAt).toDate();
    $scope.startAt = moment(tripPlan.startAt).toDate();
    $scope.backAt = moment(tripPlan.backAt).toDate();
    let budgets: any[] = await Models.tripDetail.find({tripPlanId: id});
    let hotel;
    let goTraffic;
    let backTraffic;
    let other;
    $scope.hotelStatus = false;
    $scope.goTrafficStatus = false;
    $scope.backTrafficStatus = false;
    $scope.otherStatus = false;
    let statusTxt = {};
    statusTxt[EPlanStatus.AUDIT_NOT_PASS] = "未通过";
    statusTxt[EPlanStatus.NO_BUDGET] = "没有预算";
    statusTxt[EPlanStatus.WAIT_UPLOAD] = "待上传票据";
    statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交状态";
    statusTxt[EPlanStatus.AUDITING] = "已提交待审核状态";
    statusTxt[EPlanStatus.COMPLETE] = "审核完，已完成状态";
    $scope.statustext = statusTxt;
    budgets.map(function(budget) {
        let tripType: ETripType = ETripType.OTHER;
        let title = '补助'
        if (budget.type == 0) {
            tripType = ETripType.OUT_TRIP;
            title = '去程交通'
        }
        if (budget.type == 1) {
            tripType = ETripType.BACK_TRIP;
            title = '回城交通'
        }
        if (budget.type == 2) {
            tripType = ETripType.HOTEL;
            title = '住宿'
        }
        let type = EInvoiceType.PLANE;
        if (budget.invoiceType == 0) {
            type = EInvoiceType.TRAIN;
        }
        if (budget.invoiceType == 2) {
            type = EInvoiceType.HOTEL;
        }
        if (tripType == ETripType.OUT_TRIP) {
            $scope.goTrafficStatus = Boolean(budget.status);
            goTraffic = {id: budget.id, price: budget.budget, tripType: tripType, type: type ,status:budget.status,title:'上传'+title + '发票',done:function (response) {
                var fileId = response.fileId;
                uploadInvoice(budget.id, fileId, function (err, result) {
                    if (err) {
                        alert(err);
                        return;
                    }
                    $scope.goTrafficStatus = true;
                    $scope.$apply();
                    // $state.reload();
                });
            }};
        } else if (tripType == ETripType.BACK_TRIP) {
            $scope.backTrafficStatus = Boolean(budget.status);
            backTraffic = {id: budget.id, price: budget.budget, tripType: tripType, type: type ,status:budget.status,title:'上传'+title + '发票',done:function (response) {
                var fileId = response.fileId;
                uploadInvoice(budget.id, fileId, function (err, result) {
                    if (err) {
                        alert(err);
                        return;
                    }
                    $scope.backTrafficStatus = true;
                    $scope.$apply();
                });
            }};
        } else if (tripType == ETripType.HOTEL) {
            $scope.hotelStatus = Boolean(budget.status);
            hotel = {id: budget.id, price: budget.budget, tripType: tripType, type: type ,status:budget.status,title:'上传'+title + '发票',done:function (response) {
                var fileId = response.fileId;
                uploadInvoice(budget.id, fileId, function (err, result) {
                    if (err) {
                        alert(err);
                        return;
                    }
                    $scope.hotelStatus = true;
                    $scope.$apply();
                });
            }};
        } else {
            $scope.otherStatus = Boolean(budget.status);
            other = {id: budget.id, price: budget.budget, tripType: tripType, type: type ,status:budget.status,title:'上传'+title + '发票',done:function (response) {
                var fileId = response.fileId;
                uploadInvoice(budget.id, fileId, function (err, result) {
                    if (err) {
                        alert(err);
                        return;
                    }
                    $scope.otherStatus = true;
                    $scope.$apply();
                });
            }};
        }
    });
    $scope.goTraffic = goTraffic;
    $scope.hotel = hotel;
    $scope.backTraffic = backTraffic;
    $scope.other = other;
    $scope.budgets = budgets;
    API.require('tripPlan');
    await API.onload();
    function uploadInvoice(consumeId, picture, callback) {
        API.tripPlan.uploadInvoice({
            tripDetailId: consumeId,
            pictureFileId: picture
        }, callback);
    }
    $scope.backtraffic_up = '&#xe90e;<em>回程</em><strong>交通票据</strong>';

    $scope.approveTripPlan = async function() {
        console.info("click me....")
        let ret = await API.tripPlan.commitTripPlan({id: id});
        alert('提交成功')
        window.location.href="#/trip/list"
    }
}