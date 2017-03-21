/**
 * Created by seven on 2017/3/8.
 */
"use strict";

import moment = require('moment');
import { Staff } from '_types/staff/staff';
import {destinationController} from "./destination-template";
import {Place} from "_types/place";
import {ISegment, ICreateBudgetAndApproveParams} from "_types/tripPlan";

var msgbox = require('msgbox');
import _ = require('lodash');
declare var API;

var defaultTrip = {
    beginDate: moment().add(3, 'days').startOf('day').hour(18).toDate(),
    endDate: moment().add(4, 'days').startOf('day').hour(9).toDate(),
    destination: undefined,
    placeName: '',
    reason: '',

    traffic: true,
    origin: undefined,
    round: true,

    hotel: true,
    hotelPlace: undefined,
    hotelName: '',
};

type TripDefine = typeof defaultTrip;
function TripDefineFromJson(obj: any): TripDefine{
    if(obj == undefined)
        return defaultTrip;
    obj.beginDate = new Date(obj.beginDate);
    obj.endDate = new Date(obj.endDate);
    return obj as TripDefine;
}

export async function CreateController($scope, $storage,$stateParams, $loading, ngModalDlg, $ionicPopup, Models, City, $rootScope){
    require('./create.scss');
    $scope.showOrigin = false;
    $scope.showDestination = false;
    $scope.currentStaff = await Staff.getCurrent();
    let currentCompany = $scope.currentStaff.company;
    let trip = _.clone(defaultTrip);
    let query: ICreateBudgetAndApproveParams = null;
    if($stateParams.params){
        query = JSON.parse($stateParams.params);
        if(query.originPlace){
            $scope.showOrigin = true;
            let origin = await API.place.getCityInfo({cityCode: query.originPlace});
            trip.origin = origin;
        }
        trip.round = query.isRoundTrip;
        if(query.destinationPlacesInfo && _.isArray(query.destinationPlacesInfo) && query.destinationPlacesInfo.length > 0){
            let oldParams: ISegment = query.destinationPlacesInfo[0];
            let destination = await API.place.getCityInfo({cityCode: oldParams.destinationPlace});
            trip.destination = destination;
            trip.beginDate = oldParams.leaveDate;
            trip.endDate = oldParams.goBackDate;
            trip.traffic = oldParams.isNeedTraffic;
            trip.hotel = oldParams.isNeedHotel;
            trip.hotelPlace = oldParams.businessDistrict;
            trip.hotelName = oldParams.hotelName;
            trip.reason = oldParams.reason;
            $scope.subsidy = oldParams.subsidy;
            $scope.showDestination = true;
        }else{
            let qs: ISegment = query as ISegment;
            if(qs.destinationPlace){
                $scope.showDestination = true;
            }
            trip.destination = {id: qs.destinationPlace};
            trip.beginDate = qs.leaveDate;
            trip.endDate = qs.goBackDate;
            trip.traffic = qs.isNeedTraffic;
            trip.hotel = qs.isNeedHotel;
            trip.hotelPlace = qs.businessDistrict;
            trip.hotelName = qs.hotelName;
            trip.reason = qs.reason;
            $scope.subsidy = qs.subsidy;
        }
    }
    $scope.trip = trip;

    $scope.oldBeginDate = trip.beginDate;

    $storage.local.set('trip', trip);

    $rootScope.$on('$stateChangeSuccess', function(){
        trip = _.clone(defaultTrip);
        $scope.trip=trip;
    })
    $scope.$watch('trip.beginDate', function(n, o){
        if (!trip.endDate || trip.endDate <= trip.beginDate) {
            trip.endDate = moment(trip.beginDate).add(3, 'days').toDate();
        }
    })
    $scope.calcTripDuration = function(){
        return moment(trip.endDate).startOf('day').diff(moment(trip.beginDate).startOf('day'), 'days') || 1;
    };
    $scope.addStartCity = async function(){
        let option = $scope.placeSelector;
        option.title = '出发地选择';
        let city = await ngModalDlg.selectCity($scope,option,$scope.trip.origin);
        if(city){
            $scope.showOrigin = true;
            $scope.trip.origin = city;
        }
    }
    $scope.onlyHotel = async function(){
        let option = $scope.fromPlaceSelector;
        $scope.trip.reason ='';
        option.title = '目的地选择';
        let city = await ngModalDlg.selectCity($scope,option,$scope.trip.destination);
        if(city){
            $scope.trip.destination = city;
            $scope.changeDestination($scope.trip);
        }
    }
    $scope.changeDestination = async function(trip){
        let ret = await ngModalDlg.createDialog({
            parent: $scope,
            scope:{
                trip: $scope.trip,
                beginDate: $scope.trip.beginDate,
                endDate: $scope.trip.endDate
            },
            template: require('./destination-template.html'),
            controller: destinationController
        })
        if(ret){
            $scope.showDestination = true;
            $scope.trip = ret.trip;
            $scope.subsidy = ret.subsidy;
        }else if(!$scope.showDestination){
            $scope.trip.destination = undefined;
        }
    }
    async function queryAllPlaces(keyword: string, isAbroad: boolean){
        let key= 'hot_cities_170228_domestic';
        if (isAbroad) {
            key = 'hot_cities_170228_abroad';
        }
        if (!keyword) {
            let hotCities = $storage.local.get(key)
            if (hotCities && hotCities[0] && hotCities[0].id) {
                return hotCities;
            }
        }
        var places = await API.place.queryPlace({keyword: keyword, isAbroad: isAbroad});
        if (!keyword) {
            $storage.local.set(key, places);
        }
        return places;
    }
    async function queryAbroadPlaces(){
        let key = 'abroad_cities_170228'
        let abroad = $storage.local.get(key);
        if(!abroad){
            abroad = await API.place.queryCitiesGroupByLetter({isAbroad:true});
            $storage.local.set(key,abroad);
        }
        return abroad;
    }
    async function queryDomesticPlaces(){
        let key = 'domestic_cities_170228';
        let domistic = $storage.local.get(key);
        if(!domistic){
            domistic = await API.place.queryCitiesGroupByLetter({isAbroad:false});
            $storage.local.set(key,domistic);
        }
        return domistic;
    }
    $scope.placeSelector = {
        queryAll: queryAllPlaces,
        queryAbroad: queryAbroadPlaces,
        queryDomestic: queryDomesticPlaces,
        display: '{{$item.name}}<span ng-if="$item.isAbroad && item.code">({{$item.code}})</span>',
        //display: (item)=> {
        //   if (item.isAbroad && item.code) {
        //       return `${item.name}(${item.code})`;
        //  }
        //  return item.name
        // }
    };
    $scope.fromPlaceSelector = {
        queryAll: queryAllPlaces,
        queryAbroad: queryAbroadPlaces,
        queryDomestic: queryDomesticPlaces,
        display: (item)=> {
            if (item.isAbroad && item.code) {
                return `${item.name}(${item.code})`;
            }
            return item.name
        }
    };
    $scope.nextStep = async function(){
        let trip = $scope.trip;

        if(!trip.destination || !trip.destination.id) {
            return false;
        }
        if(!trip.reasonName) {
            return false;
        }

        let params = {
            originPlace: trip.origin? trip.origin.id : null,
            isRoundTrip: trip.round,
            destinationPlacesInfo: []
        };

        let destinationItem: ISegment = {
            destinationPlace: trip.destination ? trip.destination.id : null,
            leaveDate: moment(trip.beginDate).toDate(),
            goBackDate: moment(trip.endDate).toDate(),
            latestArrivalDateTime: moment(trip.beginDate).toDate(),
            earliestGoBackDateTime: moment(trip.endDate).toDate(),
            isNeedTraffic: trip.traffic,
            isNeedHotel: trip.hotel,
            businessDistrict: trip.hotelPlace,
            hotelName: trip.hotelName,
            subsidy: $scope.subsidy,
            reason: trip.reason
        };
        if(trip.origin && trip.origin.id == destinationItem.destinationPlace){
            msgbox.log("出差地点和出发地不能相同");
            return false;
        }
        if(!trip.origin){
            destinationItem.isNeedTraffic = false;
            params.isRoundTrip = false;
            // params.originPlace = destinationItem.destinationPlace;
        }
        if(!destinationItem.destinationPlace) {
            $scope.showErrorMsg('请填写出差目的地！');
            return false;
        }
        params.destinationPlacesInfo.push(destinationItem);


        $storage.local.set('trip',trip);
        let number = 0;
        if(trip.traffic){
            number = number + 1;
        }
        if(trip.round){
            number = number + 1;
        }
        if(trip.hotel){
            number = number + 1;
        }
        try{
           await currentCompany.beforeGoTrip({number: number});
        }catch(e){
            $ionicPopup.confirm({
                title: '行程余额不足',
                template: '行程余额不足无法获取预算，请通知管理员进行充值或使用特别审批',
                buttons:[
                    {
                        text:'取消',
                        type: 'button-calm button-outline',
                    },
                    {
                        text: '特别审批',
                        type: 'button-calm',
                        onTap: function(){
                            window.location.href = "#/trip/special-approve?params="+JSON.stringify(params);
                        }
                    }
                ]
            })
            return false;
        }
        let beginMSecond = Date.now();
        API.require("travelBudget");
        await API.onload();

        if(!trip.reasonName) {
            $scope.showErrorMsg('请填写出差事由！');
            return false;
        }

        if(!trip.traffic && ! trip.hotel) {
            $scope.showErrorMsg('请选择交通或者住宿！');
            return false;
        }

        if(moment(trip.endDate).toDate().getTime() - moment(trip.beginDate).toDate().getTime() <= 0) {
            $scope.showErrorMsg('到达时间不可晚于离开时间！');
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
                    return cb();
                }
            }
            $loading.reset();
            $loading.start({
                template: template,
            });
        }, 1000);

        let calTimer;
        try {
            calTimer = setTimeout( () => {
                alert('系统错误，请稍后重试');
                $loading.end();
            }, 60 * 1000);

            /*let addParams = {
                destinationPlace: "CT_289",
                leaveDate: moment(trip.beginDate).add(2,'d').toDate(),
                goBackDate: moment(trip.endDate).add(4,'d').toDate(),
                latestArrivalDateTime: moment(trip.beginDate).add(2,'d').toDate(),
                earliestGoBackDateTime: moment(trip.endDate).add(4,'d').toDate(),
                isNeedTraffic: true,
                isNeedHotel: true,
                businessDistrict: "",
                hotelName: "",
                subsidy: $scope.subsidy,
                reason: trip.reason
            }
             params.destinationPlacesInfo.push(addParams);*/
            budget = await API.travelBudget.getTravelPolicyBudget(params);
            if (isShowDone) {
                cb();
            }
        } catch(err) {
            clearTimeout(calTimer);
            clearInterval(timer);
            $loading.end();
            alert(err.msg || err);
        }
        let endMSecond = Date.now();
        spendMS(beginMSecond, endMSecond);
        function spendMS(begin, end) {
            console.info('开始时间:', begin, '结束时间:', end, '耗时:', end - begin);
        }
        function cb() {
            clearTimeout(calTimer);
            $loading.end();
            window.location.href = "#/trip/budget?id="+budget;
        }
    }

    $scope.specialApprove = async function() {
        API.require("travelBudget");
        await API.onload();

        let trip = $scope.trip;

        if(!trip.place || !trip.place.id) {
            $scope.showErrorMsg('请填写出差目的地！');
            return false;
        }

        if(!trip.reasonName) {
            $scope.showErrorMsg('请填写出差事由！');
            return false;
        }

        let params = {
            originPlace: trip.fromPlace? trip.fromPlace.id : '',
            isRoundTrip: trip.round,
            destinationPlacesInfo: []
        };

        let destinationItem = {
            destinationPlace: trip.place ? trip.place.id : '',
            leaveDate: moment(trip.beginDate).toDate(),
            goBackDate: moment(trip.endDate).toDate(),
            latestArrivalDateTime: moment(trip.beginDate).toDate(),
            earliestGoBackDateTime: moment(trip.endDate).toDate(),
            isNeedTraffic: trip.traffic,
            isRoundTrip: trip.round,
            isNeedHotel: trip.hotel,
            businessDistrict: trip.hotelPlace,
            hotelName: trip.hotelName,
        };

        params.destinationPlacesInfo.push(destinationItem);

        /*let addParams = {
            isRoundTrip: true,
            destinationPlace: "CT_289",
            leaveDate: moment(trip.beginDate).add(2,'d').toDate(),
            goBackDate: moment(trip.endDate).add(4,'d').toDate(),
            latestArrivalDateTime: moment(trip.beginDate).add(2,'d').toDate(),
            earliestGoBackDateTime: moment(trip.endDate).add(4,'d').toDate(),
            isNeedTraffic: true,
            isNeedHotel: true,
            businessDistrict: "",
            hotelName: "",
            subsidy: $scope.subsidy,
            reason: trip.reason
        }
        params.destinationPlacesInfo.push(addParams);
        console.info(params);*/

        /*if(params.originPlace == params.destinationPlace){
            msgbox.log("出差地点和出发地不能相同");
            return false;
        }*/

        try {
            $loading.end();
            window.location.href = "#/trip/special-approve?params="+JSON.stringify(params);
        } catch(err) {
            $loading.end();
            alert(err.msg || err);
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
