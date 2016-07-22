"use strict";

import moment = require('moment');
var API = require("common/api");
var Cookie = require('tiny-cookie');
import { Staff } from 'api/_types/staff';
import { Models } from 'api/_types';
import {
    TripDetail, EPlanStatus, ETripType, EInvoiceType, EAuditStatus, MTxPlaneLevel
} from "api/_types/tripPlan";
var msgbox = require('msgbox');


var defaultTrip = {
    beginDate: moment().add(3, 'days').startOf('day').hour(9).toDate(),
    endDate: moment().add(4, 'days').startOf('day').hour(21).toDate(),
    place: '',
    placeName: '',
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

export async function CreateController($scope, $storage, $loading){
    require('./trip.scss');
    API.require('tripPlan');
    await API.onload();

    let minStDate = moment().format('YYYY-MM-DD');
    $scope.minStDate = minStDate;
    $scope.minEndDate = moment().add(3, 'days').format('YYYY-MM-DD');

    let trip;
    try {
        trip= TripDefineFromJson($storage.local.get('trip'));
    } catch(err) {
        trip = {};
    }


    //定位当前ip位置
    /*try {
        var position = await API.tripPlan.getIpPosition({});
        trip.fromPlace = position.id;
        trip.fromPlaceName = position.name;
    } catch(err) {
        // msgbox.log(err.msg);
    }*/

    if(!trip.regenerate) {
        trip = defaultTrip;
        await $storage.local.set('trip', trip);
    }else {
        var today = moment();
        if (!trip.beginDate || (new Date(trip.beginDate) < new Date())) {
            trip.beginDate = today.startOf('day').hour(9).toDate();
        }

        if (!trip.endDate || (new Date(trip.beginDate)) >= new Date(trip.endDate)) {
            trip.endDate = moment(trip.beginDate).add(3, 'days').toDate();
        }
        trip.regenerate = false;
    }

    $scope.oldBeginDate = trip.beginDate;

    $storage.local.set('trip', trip);
    $scope.trip = trip;
    $scope.$watch('trip', function(){
        $storage.local.set('trip', $scope.trip);
    }, true);

    $scope.calcTripDuration = function(){
        return moment(trip.endDate).diff(trip.beginDate, 'days') || 1;
    };
    $scope.incTripDuration = function(){
        trip.endDate = moment(trip.endDate).add(1, 'days').toDate();
        $scope.$applyAsync();
    };
    $scope.decTripDuration = function(){
        var newDate = moment(trip.endDate).subtract(1, 'days').toDate();
        if(newDate > trip.beginDate){
            trip.endDate = newDate;
            $scope.$applyAsync();
        }
    };

    $scope.$watch('trip.placeName', function($newVal, $oldVal) {
        if ($newVal != $oldVal) {
            $scope.trip.hotelPlaceObj = undefined;
            $scope.trip.hotelPlace = '';
        }
    });

    async function queryPlaces(keyword){
        if (!keyword) {
            let hotCities = $storage.local.get("hot_cities")
            if (hotCities) {
                return hotCities;
            }
        }
        var places = await API.place.queryPlace({keyword: keyword});
        places = places.map((place)=> {return {name: place.name, value: place.id} });
        if (!keyword) {
            $storage.local.set('hot_cities', places);
        }
        return places;
    }
    $scope.placeSelector = {
        query: queryPlaces,
        done: function(val) {
            $scope.trip.place = val.value;
        }
    };
    $scope.fromPlaceSelector = {
        query: queryPlaces,
        done: function(val) {
            $scope.trip.fromPlace = val.value;
        }
    };
    $scope.hotelPlaceSelector = {
        query: async function(keyword) {
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
        },
        done: function(val) {
            if (!val.point || !val.point.lat || !val.point.lng) {
                $scope.showErrorMsg("获取住宿位置失败");
                return;
            }
            $scope.trip.hotelPlace = val.point.lat + "," + val.point.lng
        }
    };
    $scope.projectSelector = {
        query: async function(keyword){
            var staff = await Staff.getCurrent();
            var options = {where:{companyId: staff.company.id}};
            if(keyword){
                options.where["name"] = {$like: '%'+keyword+'%'};
            }
            var projects = await Models.project.find(options);
            return projects.map((project)=>{ return {name: project.name, value: project.id}} );
        },
        create: async function(name){
            console.info("function createProject...");
        },
        done: function(val) {
            $scope.trip.reason = val.name ? val.name: val;
            console.info($scope.trip.reason);
        }
    }

    $scope.beginDateSelector = {
        done: function(val) {
            //$scope.trip.beginDate = val.value;
        }
    };
    $scope.nextStep = async function() {
        API.require("travelBudget");
        await API.onload();

        let trip = $scope.trip;

        if(!trip.place) {
            $scope.showErrorMsg('请填写出差目的地！');
            return false;
        }

        if(!trip.reasonName) {
            $scope.showErrorMsg('请填写出差事由！');
            return false;
        }

        if(!trip.traffic && ! trip.hotel) {
            $scope.showErrorMsg('请选择交通或者住宿！');
            return false;
        }

        if(trip.traffic && !trip.fromPlace) {
            $scope.showErrorMsg('请选择出发地！');
            return false;
        }

        let params = {
            originPlace: trip.fromPlace,
            destinationPlace: trip.place,
            leaveDate: moment(trip.beginDate).format('YYYY-MM-DD'),
            goBackDate: moment(trip.endDate).format('YYYY-MM-DD'),
            leaveTime: moment(trip.beginDate).format('HH:mm'),
            goBackTime: moment(trip.endDate).format('HH:mm'),
            isNeedTraffic: trip.traffic,
            isRoundTrip: trip.round,
            isNeedHotel: trip.hotel,
            businessDistrict: trip.hotelPlace
        };

        if(params.originPlace == params.destinationPlace){
            msgbox.log("出差地点和出发地不能相同");
            return false;
        }

        let front = ['正在验证出行参数', '正在匹配差旅政策', '正在搜索全网数据', '动态预算即将完成'];
        $loading.reset();
        $loading.start({
            template: '预算计算中...'
        });
        let idx = 0;
        let isShowDone = false;
        let budget;
        let timer = setInterval(async function() {
            let template = front[idx++]+'...';
            if (idx >= front.length) {
                clearInterval(timer);
                isShowDone = true;
                if (budget) {
                    cb();
                }
            }
            $loading.reset();
            $loading.start({
                template: template,
            });
        }, 1000);

        try {
            budget = await API.travelBudget.getTravelPolicyBudget(params);
            if (isShowDone) {
                cb();
            }
        } catch(err) {
            clearInterval(timer);
            $loading.end();
            alert(err.msg || err);
        }

        function cb() {
            $loading.end();
            window.location.href = "#/trip/budget?id="+budget;
        }
    }

    $scope.checkDate = function(isStartTime?: boolean) {
        let beginDate = trip.beginDate;
        let endDate = trip.endDate;
        if(moment(endDate).diff(moment(beginDate)) < 0) {
            if(isStartTime) {
                $scope.minEndDate = moment(beginDate).format('YYYY-MM-DD');
            }else {
                $scope.showErrorMsg('结束日期不能早于结束日期！');
            }
            $scope.trip.endDate = beginDate;
            return;
        }

        $scope.oldBeginDate = beginDate;
        $scope.minEndDate = moment(beginDate).format('YYYY-MM-DD');
    }
}

export async function BudgetController($scope, $storage, Models, $stateParams, $ionicLoading){
    require('./trip.scss');
    API.require("tripPlan");
    await API.onload();

    var id = $stateParams.id;
    API.require("travelBudget");
    await API.onload();
    let result = await API.travelBudget.getBudgetInfo({id: id});
    let budgets = result.budgets;
    let trip = $storage.local.get("trip");
    let query = result.query;
    trip.beginDate = query.leaveDate;
    trip.endDate  = query.goBackDate;
    trip.createAt = new Date(result.createAt);

    if(query.originPlace) {
        let originPlace = await API.place.getCityInfo({cityCode: query.originPlace});
        trip.originPlaceName = originPlace.name;
    }

    let destination = await API.place.getCityInfo({cityCode: query.destinationPlace});
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
    $scope.MTxPlaneLevel = MTxPlaneLevel;
    API.require("tripPlan");
    await API.onload();

    $scope.staffSelector = {
        query: async function(keyword) {
            let staff = await Staff.getCurrent();
            let staffs = await staff.company.getStaffs({where: {id: {$ne: staff.id}}});
            return staffs.map((p) =>{ return  {name: p.name, value: p.id}} );
        },
        done: function(value) {
            console.info("调用回调", value);
            trip.auditUser = value.value;
        }
    };

    $scope.saveTripPlan = async function() {
        let trip = $scope.trip;

        if(!trip.auditUserName) {
            $scope.showErrorMsg('请选择审核人！');
            return false;
        }

        await $ionicLoading.show({
            template: "保存中...",
            hideOnStateChange: true
        });

        try {
            let planTrip = await API.tripPlan.saveTripPlan({budgetId: id, title: trip.reason||trip.reasonName, auditUser: trip.auditUser})
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
        window.location.href = '#/trip/list-detail?tripid='+id;
    }
}

export async function DetailController($scope, $stateParams, Models, $location){
    require('./trip.scss');
    let id = $stateParams.id;
    if (!id) {
        $location.path("/");
        return;
    }
    let tripPlan = await Models.tripPlan.get(id);
    let budgets: any[] = await Models.tripDetail.find({where: {tripPlanId: id}});
    $scope.createdAt = moment(tripPlan.createAt).toDate();
    $scope.startAt = moment(tripPlan.startAt).toDate();
    $scope.backAt = moment(tripPlan.backAt).toDate();

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
    statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交";
    statusTxt[EPlanStatus.AUDITING] = "已提交待审核";
    statusTxt[EPlanStatus.COMPLETE] = "已完成";
    $scope.statustext = statusTxt;
    $scope.isHasNextPage = true;
    $scope.tripPlans = [];
    let pager = await staff.getTripPlans({
        limit: 5,
        where: {
            status: {$in: [EPlanStatus.WAIT_UPLOAD, EPlanStatus.WAIT_COMMIT, EPlanStatus.AUDIT_NOT_PASS, EPlanStatus.COMPLETE, EPlanStatus.NO_BUDGET, EPlanStatus.AUDITING]}
        }
    });
    loadTripPlan(pager);
    var vm = {
        hasNextPage: function() {
            return pager.totalPages-1 > pager.curPage;
        },
        nextPage : async function() {
            try {
                pager = await pager.nextPage();
            } catch(err) {
                alert("获取数据时,发生异常");
                return;
            }
            loadTripPlan(pager);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    }

    $scope.vm = vm;

    $scope.enterdetail = function(trip){
        if (!trip) return;
        window.location.href = "#/trip/list-detail?tripid="+trip.id;
    }

    function loadTripPlan(pager) {
        pager.forEach(function(trip){
            $scope.tripPlans.push(trip);
        });
    }
}


export async function ListDetailController($location, $scope , Models, $stateParams, $storage, $ionicPopup, wxApi){
    let id = $stateParams.tripid;
    if (!id) {
        $location.path("/");
        return;
    }
    //////绑定上传
    let authDataStr = window['getAuthDataStr']();
    $scope.uploadUrl = '/upload/ajax-upload-file?type=image&'+authDataStr;
    ///// END

    require('./trip.scss');
    var staff = await Staff.getCurrent();
    let tripPlan = await Models.tripPlan.get(id);
    $scope.tripDetail = tripPlan;

    let logs = await tripPlan.getLogs({});

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
    statusTxt[EPlanStatus.CANCEL] = "已撤销";
    statusTxt[EPlanStatus.AUDIT_NOT_PASS] = "未通过";
    statusTxt[EPlanStatus.NO_BUDGET] = "没有预算";
    statusTxt[EPlanStatus.WAIT_UPLOAD] = "待上传票据";
    statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交";
    statusTxt[EPlanStatus.AUDITING] = "已提交待审核";
    statusTxt[EPlanStatus.COMPLETE] = "已完成";
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
                    alert(response.errMsg);
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
                    alert(response.errMsg);
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
                    alert(response.errMsg);
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
    budgets.sort(function(v1, v2) {
        return v1.type - v2.type;
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

    $scope.showAlterDialog = function () {
        $scope.reject = {reason: ''};
        $ionicPopup.show({
            title: '确认提交该出差计划？',
            scope: $scope,
            buttons: [{
                text: '取消'
            },{
                text: '确认',
                type: 'button-positive',
                onTap: async function (e) {
                    approveTripPlan();
                }
            }]
        })
    };

    async function approveTripPlan() {
        try {
            console.info('before commit...');
            await API.tripPlan.commitTripPlan({id: id});
            console.info('after commit...');
            var alertPop = $ionicPopup.alert({
                title:'提示',
                template:'提交成功'
            });
            alertPop.then(function(res){
                window.location.href="#/trip/list";
            })

        }catch(e) {
            alert(e.msg || e);
        }
    };

    $scope.createTripPlan = async function() {
        let tripPlan = $scope.tripDetail;
        let tripDetails = $scope.budgets;
        let trip: any = {
            regenerate: true,
            beginDate: moment(tripPlan.startAt).toDate(),
            endDate: moment(tripPlan.backAt).toDate(),
            place: tripPlan.arrivalCityCode,
            placeName: tripPlan.arrivalCity,
            reasonName: tripPlan.title
        };
        await Promise.all(tripDetails.map(async (detail) => {
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
                    trip.hotelPlace = detail.hotelCode || '';
                    trip.hotelPlaceName = detail.hotelName || '';
                    let landMarkInfo = {name: ''};
                    if(detail.hotelName) {
                        landMarkInfo = await API.place.getCityInfo({cityCode: detail.hotelName});
                    }
                    if(landMarkInfo && landMarkInfo.name){
                        trip.hotelPlaceName = landMarkInfo.name;
                    }
            }
        }));
        await $storage.local.set('trip', trip);
        window.location.href="#/trip/create";
    };
    
    $scope.cancelTripPlan = function() {
        console.info("取消出差计划...");
        $ionicPopup.show({
            title: '确认撤销该出差计划？',
            scope: $scope,
            buttons: [{
                text: '取消'
            },{
                text: '确认',
                type: 'button-positive',
                onTap: async function (e) {
                    let tripPlan = $scope.tripDetail;
                    await tripPlan.cancel();
                    $scope.showErrorMsg('撤销成功');
                }
            }]
        })
    };
    
    $scope.checkInvoice = function(detailId){
        window.location.href="#/trip/invoice-detail?detailId="+detailId;
    }
}

export async function InvoiceDetailController($scope , Models, $stateParams){
    //////绑定上传url
    let authDataStr = window['getAuthDataStr']();
    $scope.uploadUrl = '/upload/ajax-upload-file?type=image&'+authDataStr;
    ///// END
    
    //////////////显示票据之前先显示loading图
    $scope.showLoading = true;
    angular.element("#previewInvoiceImg").bind("load", function() {
        $scope.showLoading = false;
        $scope.$apply();
    })
    //END

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
    $scope.invoicefuc = {title:'上传'+title + '发票',done:function(response){
        var fileId = response.fileId;
        uploadInvoice(invoice, fileId,async function (err, result) {
            if (err) {
                alert(err.msg ? err.msg : err);
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