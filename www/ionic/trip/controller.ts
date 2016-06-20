///<reference path="../../../api/_types/tripPlan.ts"/>
"use strict";

import moment = require('moment');
var API = require("common/api");
var Cookie = require('tiny-cookie');
import { Staff } from 'api/_types/staff';
import { Models } from 'api/_types';
import {
    TripDetail, EPlanStatus, ETripType, EInvoiceType, EAuditStatus
} from "api/_types/tripPlan";
var msgbox = require('msgbox');


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

export async function CreateController($scope, $storage, $ionicLoading){
    API.require('tripPlan');
    await API.onload();

    let trip;
    try {
        trip= TripDefineFromJson($storage.local.get('trip'));
    } catch(err) {
        trip = {};
    }
    //定位当前ip位置
    try {
        var position = await API.tripPlan.getIpPosition({});
        trip.fromPlace = position.id;
        trip.fromPlaceName = position.name;
    } catch(err) {
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

    $scope.$watch('trip.placeName', function($newVal, $oldVal) {
        if ($newVal != $oldVal) {
            $scope.trip.hotelPlaceName = ''
            $scope.trip.hotelPlace = '';
        }
    });

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
        return places.map((place)=> {return {name: place.name, value: place.id} });
    }

    $scope.queryHotelPlace = async function(keyword) {
        let city = $scope.trip.place;
        if (city) {
            let cityId: any = city;
            if (!/^CT_\d+$/.test(city)) {
                city = await API.place.getCityInfo({cityCode: city});
                cityId = city.id;
            }
            var hotelPlaces = await API.place.queryBusinessDistrict({keyword: keyword, code: cityId})
            return hotelPlaces.map((p)=> { return { name: p.name, value: p.id} });
        }
        return [];
    }
    
    $scope.queryProjects = async function(keyword){
        var staff = await Staff.getCurrent();
        var projects = await Models.project.find({where:{companyId: staff.company.id}});
        return projects.map((project)=>{ return {name: project.name, value: project.id}} );
    }
    $scope.createProject = async function(name){
        console.info("function createProject...");
    }

    $scope.nextStep = async function() {
        API.require("travelBudget");
        await API.onload();

        let trip = $scope.trip;
        let params = {
            originPlace: trip.fromPlace,
            destinationPlace: trip.place,
            leaveDate: moment(trip.beginDate).format('YYYY-MM-DD'),
            goBackDate: moment(trip.endDate).format('YYYY-MM-DD'),
            leaveTime: moment(trip.beginDate).format('HH:mm'),
            goBackTime: moment(trip.endDate).format('HH:mm'),
            isNeedTraffic: trip.traffic,
            isRoundTrip: trip.round,
            isNeedHotel: trip.hotel
        }
        let front = ['正在验证出行参数', '正在匹配差旅政策', '正在搜索全网数据', '动态预算即将完成'];
        await $ionicLoading.show({
            template: '预算计算中...',
            hideOnStateChange: true,
        });
        let idx = 0;
        let isShowDone = false;
        let budget;
        let timer = setInterval(async function() {
            let template = front[idx++]+'...'
            if (idx >= front.length) {
                clearInterval(timer);
                isShowDone = true;
                if (budget) {
                    cb();
                }
            }
            await $ionicLoading.show({
                template: template,
                hideOnStateChange: true,
            });
        }, 1000);

        try {
            budget = await API.travelBudget.getTravelPolicyBudget(params);
            if (isShowDone) {
                cb();
            }
        } catch(err) {
            clearInterval(timer);
            await $ionicLoading.hide()
            alert(err.msg || err);
        }

        function cb() {
            $ionicLoading.hide()
            window.location.href = "#/trip/budget?id="+budget;
        }
    }

    $scope.choosePlace = function(val) {
        $scope.trip.place = val.value;
    }
    $scope.chooseFromPlace = function(val) {
        $scope.trip.fromPlace = val.value;
    }
    $scope.chooseHotelPlace = function(val) {
        $scope.trip.hotelPlace = val.value;
    }
    $scope.chooseReason = function(val) {
        $scope.trip.reason = val.name ? val.name: val;
        console.info($scope.trip.reason);
    }
}

export async function BudgetController($scope, $storage, Models, $stateParams, $ionicLoading){
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
    let originPlace = await API.place.getCityInfo({cityCode: result.query.originPlace});
    trip.originPlaceName = originPlace.name;
    let destination = await API.place.getCityInfo({cityCode: result.query.destinationPlace});
    trip.destinationPlaceName = destination.name;
    $scope.trip = trip;
    //补助,现在是0,后续可能会直接加入到预算中
    let totalPrice: number = 0;
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
    $scope.budgets = budgets;
    $scope.EInvoiceType = EInvoiceType;
    $scope.ETripType = ETripType;
    API.require("tripPlan");
    await API.onload();

    //选择审核人
    $scope.queryStaffs = async function(keyword) {
        let staff = await Staff.getCurrent();
        let staffs = await staff.company.getStaffs({where: {id: {$ne: staff.id}}});
        return staffs.map((p) =>{ return  {name: p.name, value: p.id}} );
    }
    //选择完成后的回调
    $scope.chooseAuditUser = function(value) {
        console.info("调用回调", value);
        trip.auditUser = value.value;
    }

    $scope.saveTripPlan = async function() {
        await $ionicLoading.show({
            template: "保存中...",
            hideOnStateChange: true
        });

        try {
            let planTrip = await API.tripPlan.saveTripPlan({budgetId: id, title: trip.reason, auditUser: trip.auditUser})
            window.location.href = '#/trip/committed?id='+planTrip.id;
        } catch(err) {
            alert(err.msg || err);
        } finally {
            $ionicLoading.hide();
        }
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

export async function DetailController($scope, $stateParams, Models, $location){
    let id = $stateParams.id;
    if (!id) {
        $location.path("/");
        return;
    }
    let tripPlan = await Models.tripPlan.get(id);
    let budgets: any[] = await Models.tripDetail.find({where: {tripPlanId: id}});
    $scope.createdAt = moment(tripPlan.createAt).toDate();
    $scope.startAt = moment(tripPlan.startAt.value).toDate();
    $scope.backAt = moment(tripPlan.backAt.value).toDate();

    $scope.trip = tripPlan.target;
    $scope.budgets = budgets;
    $scope.EInvoiceType = EInvoiceType;
    $scope.ETripType = ETripType;
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
    $scope.isHasNextPage = true;
    $scope.tripPlans = [];
    let pager = await staff.getTripPlans({where: {status: {$in: [EPlanStatus.WAIT_UPLOAD, EPlanStatus.WAIT_COMMIT, EPlanStatus.AUDIT_NOT_PASS,EPlanStatus.COMPLETE,EPlanStatus.NO_BUDGET,EPlanStatus.AUDITING]}}});
    loadTripPlan(pager);

    $scope.pager = pager;
    var vm = {
        isHasNextPage:true,
        nextPage : async function() {
            try {
                pager = await $scope.pager['nextPage']();
            } catch(err) {
                this.isHasNextPage = false;
                return;
            }
            $scope.pager = pager;
            loadTripPlan(pager);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    }

    $scope.vm = vm;

    $scope.enterdetail = function(tripid){
        window.location.href = "#/trip/list-detail?tripid="+tripid;
    }

    function loadTripPlan(pager) {
        pager.forEach(function(trip){
            $scope.tripPlans.push(trip);
        });
    }
}


export async function ListDetailController($location, $scope , Models, $stateParams, $storage ){
    let id = $stateParams.tripid;
    if (!id) {
        $location.path("/");
        return;
    }
    require('./listdetail.less');
    var staff = await Staff.getCurrent();
    let tripPlan = await Models.tripPlan.get(id);
    $scope.tripDetail = tripPlan;

    let budgets: TripDetail[] = await tripPlan.getTripDetails();
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
    $scope.EPlanStatus = EPlanStatus;
    $scope.EInvoiceType = EInvoiceType;
    $scope.EPlanStatus = EPlanStatus;
    budgets.map(function(budget) {
        let tripType = budget.type;
        if (tripType == ETripType.OUT_TRIP) {
            $scope.goTrafficStatus = Boolean(budget.status);
            goTraffic = budget;
            goTraffic['title'] = '上传去程交通发票';
            goTraffic['done'] = function (response) {
                if (!response.fileId) {
                    alert(response.msg);
                    return;
                }
                var fileId = response.fileId;
                uploadInvoice(budget, fileId, async function (err, result) {
                    if (err) {
                        alert(err);
                        return;
                    }
                    $scope.goTraffic = budget;
                });
            }

        } else if (tripType == ETripType.BACK_TRIP) {
            $scope.backTrafficStatus = Boolean(budget.status);
            backTraffic = budget;
            backTraffic['title'] = '上传回程交通发票';
            backTraffic['done'] = function (response) {
                if (!response.fileId) {
                    alert(response.msg);
                    return;
                }
                var fileId = response.fileId;
                uploadInvoice(budget, fileId,async function (err, result) {
                    if (err) {
                        alert(err);
                        return;
                    }
                    // var newdetail = await Models.tripDetail.get(budget.id);
                    $scope.backTraffic = budget;
                });
            }
        } else if (tripType == ETripType.HOTEL) {
            hotel = budget;
            hotel['title'] = '上传住宿发票';
            hotel['done'] = function (response) {
                if (!response.fileId) {
                    alert(response.msg);
                    return;
                }
                var fileId = response.fileId;
                uploadInvoice(budget, fileId,async function (err, result) {
                    if (err) {
                        alert(err);
                        return;
                    }
                    // var newdetail = await Models.tripDetail.get(budget.id);
                    $scope.hotel = budget;
                });
            }
        } else {
            $scope.otherStatus = Boolean(budget.status);
            other = budget;
            // other = {id: budget.id, price: budget.budget, tripType: tripType, type: type ,status:budget.status};
        }
    });
    $scope.goTraffic = goTraffic;
    $scope.hotel = hotel;
    $scope.backTraffic = backTraffic;
    $scope.other = other;
    $scope.budgets = budgets;
    API.require('tripPlan');
    await API.onload();
    function uploadInvoice(tripDetail, picture, callback) {
        tripDetail.uploadInvoice({
            pictureFileId: picture
        })
        .then(function(ret) {
            callback(null, ret);
        })
        .catch(callback)
    }

    $scope.approveTripPlan = async function() {
        try {
            await API.tripPlan.commitTripPlan({id: id});
            alert('提交成功')
            window.location.href="#/trip/list"
        }catch(e) {
            alert(e.msg || e);
        }
    };

    $scope.createTripPlan = async function() {
        let tripPlan = $scope.tripDetail;
        let tripDetails = $scope.budgets;
        let trip: any = {
            beginDate: moment(tripPlan.startAt).toDate(),
            endDate: moment(tripPlan.backAt).toDate(),
            place: tripPlan.arrivalCityCode,
            placeName: tripPlan.arrivalCity,
            reasonName: tripPlan.title
        };
        tripDetails.map((detail) => {
            switch (detail.type) {
                case ETripType.OUT_TRIP:
                    trip.traffic = true;
                    trip.fromPlace = tripPlan.deptCityCode;
                    trip.fromPlaceName = tripPlan.deptCity;
                    break;
                case ETripType.BACK_TRIP:
                    trip.traffic = true;
                    trip.fromPlace = tripPlan.deptCityCode;
                    trip.fromPlaceName = tripPlan.deptCity;
                    trip.round = true;
                    break;
                case ETripType.HOTEL:
                    trip.hotel = true;
                    trip.hotelPlace = detail.cityCode;
                    trip.hotelPlaceName = detail.city;
            }
        });
        await $storage.local.set('trip', trip);
        window.location.href="#/trip/create";
    };
    
    $scope.checkInvoice = function(detailId){
        window.location.href="#/trip/invoice-detail?detailId="+detailId;
    }
}

export async function InvoiceDetailController($scope , Models, $stateParams){
    var invoice = await Models.tripDetail.get($stateParams.detailId);
    $scope.invoice = invoice;
    $scope.EInvoiceType = EInvoiceType;
    API.require('attachment');
    await API.onload();
    var invoiceImg = await API.attachment.previewSelfImg({fileId: invoice.newInvoice});
    $scope.invoiceImg = invoiceImg;

    let statusTxt = {};
    statusTxt[EPlanStatus.AUDIT_NOT_PASS] = "未通过";
    statusTxt[EPlanStatus.WAIT_UPLOAD] = "待上传票据";
    statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交";
    statusTxt[EPlanStatus.AUDITING] = "已提交待审核";
    statusTxt[EPlanStatus.COMPLETE] = "已完成";
    $scope.statustext = statusTxt;
    $scope.EPlanStatus = EPlanStatus;
    let title;
    if (invoice.type == ETripType.OUT_TRIP) {
        title = '去程交通';
    }
    if (invoice.type == ETripType.BACK_TRIP) {
        title = '回程交通';
    }
    if (invoice.type == ETripType.HOTEL) {
        title = '住宿';
    }
    var invoicefuc = {title:'上传'+title + '发票',done:function(response){
        var fileId = response.fileId;
        uploadInvoice(invoice, fileId,async function (err, result) {
            if (err) {
                alert(err);
                return;
            }
            var newdetail = await Models.tripDetail.get($stateParams.detailId);
            $scope.invoice = newdetail;
        });
    }}

    function uploadInvoice(tripDetail, picture, callback) {
        tripDetail.uploadInvoice({
            pictureFileId: picture
        },callback)
    }

    $scope.backtodetail = function(){
        var tripPlan = invoice.tripPlan;
        window.location.href = "#/trip/list-detail?tripid="+tripPlan.id;
    }
}