/**
 * Created by seven on 2017/3/8.
 */
"use strict";

import moment = require('moment');
import { Staff } from 'api/_types/staff/staff';
import {EApproveChannel} from "api/_types/approve/types";
import {destinationController} from "./destination-template";

var msgbox = require('msgbox');


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


export async function CreateController($scope, $storage, $loading, ngModalDlg, $ionicPopup, Models, City){
    require('./create.scss');
    $scope.showOrigin = false;
    $scope.showDestination = false;
    $scope.currentStaff = await Staff.getCurrent();
    let currentCompany = $scope.currentStaff.company;
    let trip;
    try {
        trip= TripDefineFromJson($storage.local.get('trip'));
    } catch(err) {
        trip = {};
    }

    if(!trip.regenerate) {
        trip = defaultTrip;
        await $storage.local.set('trip', trip);
    }else {
        var today = moment();
        if (!trip.beginDate || (new Date(trip.beginDate) < new Date())) {
            trip.beginDate = today.startOf('day').hour(18).toDate();
        }

        trip.regenerate = false;
    }

    $scope.oldBeginDate = trip.beginDate;

    $storage.local.set('trip', trip);
    $scope.trip = trip;
    $scope.$watch('trip', function(){
        $storage.local.set('trip', $scope.trip);
    }, true);
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
        console.info(city);
        if(city){
            $scope.showOrigin = true;
            $scope.trip.origin = city;
        }
    }
    $scope.onlyHotel = async function(){
        let option = $scope.fromPlaceSelector;
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
        console.info(ret);
        if(ret){
            $scope.showDestination = true;
            $scope.trip = ret;
            console.info(ret);
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
        console.log(domistic)
        return domistic;
    }
    $scope.placeSelector = {
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
        if(!trip.origin){
            trip.traffic = false;
        }
        let params = {
            originPlace: trip.origin? trip.origin.id : '',
            destinationPlace: trip.destination ? trip.destination.id : '',
            leaveDate: moment(trip.beginDate).toDate(),
            goBackDate: moment(trip.endDate).toDate(),
            latestArrivalDateTime: moment(trip.beginDate).toDate(),
            earliestGoBackDateTime: moment(trip.endDate).toDate(),
            isNeedTraffic: trip.traffic,
            isRoundTrip: trip.round,
            isNeedHotel: trip.hotel,
            businessDistrict: trip.hotelPlace,
            hotelName: trip.hotelName,
            subsidy: $scope.subsidy
        };
        if(trip.origin && params.originPlace == params.destinationPlace){
            msgbox.log("出差地点和出发地不能相同");
            return false;
        }
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

}