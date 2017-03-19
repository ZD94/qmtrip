/**
 * Created by seven on 2017/3/8.
 */
"use strict";
import {Staff} from "_types/staff/staff";
import moment = require('moment');
var msgbox = require('msgbox');
export async function destinationController($scope, ngModalDlg, Models, $ionicPopup, $storage){
    require('./destination-template.scss');
    $scope.projectSelector = {
        query: async function(keyword){
            var staff = await Staff.getCurrent();
            var options = {where:{companyId: staff.company.id}};
            if(keyword){
                options.where["name"] = {$like: '%'+keyword+'%'};
            }
            var projects = await Models.project.find(options);
            return projects;
        },
        create: async function(name){
            return {
                name: name,
                id: undefined
            }
        },
        done: function(val) {
            $scope.trip.reason = val.name ? val.name: val;
        }
    };
    $scope.hotelPlaceSelector = {
        done: function(val) {
            if (!val.point || !val.point.lat || !val.point.lng) {
                $scope.showErrorMsg("获取住宿位置失败");
                return;
            }
            $scope.trip.hotelPlace = val.point.lat + "," + val.point.lng
            $scope.trip.hotelName = val.title;
        }
    };

    $scope.selectDatespan = async function(){
        let value = {
            begin: $scope.trip.beginDate,
            end: $scope.trip.endDate
        }
        value = await ngModalDlg.selectDateSpan($scope, {
            beginDate: new Date(),
            endDate: moment().add(1, 'year').toDate(),
            timepicker: true,
            title: '选择开始时间',
            titleEnd: '选择结束时间',
        }, value);
        if(value){
            $scope.trip.beginDate = value.begin;
            $scope.trip.endDate = value.end;
        }

    };

    $scope.endDateSelector = {
        beginDate: $scope.trip.beginDate,
        endDate: moment().add(1, 'year').toDate(),
        timepicker: true,
    };
    $scope.$watch('trip.beginDate', function(n, o){
        $scope.endDateSelector.beginDate = $scope.trip.beginDate;
    })
    $scope.calcTripDuration = function(){
        return moment($scope.trip.endDate).startOf('day').diff(moment($scope.trip.beginDate).startOf('day'), 'days') || 1;
    };
    /*******************出差补助选择begin************************/
    $scope.select_subsidy = {
        name: '请选择'
    };
    $scope.currentStaff = await Staff.getCurrent();
    let currentCompany = $scope.currentStaff.company;
    $scope.currentTp = await $scope.currentStaff.getTravelPolicy();
    if($scope.currentTp){
        $scope.currentTpSts = await $scope.currentTp.getSubsidyTemplates();
    }
    $scope.subsidy = {hasFirstDaySubsidy: true, hasLastDaySubsidy: true, template: null};

    var ret = await $scope.currentStaff.testServerFunc();
    console.log('$scope.currentStaff.testServerFunc() return', ret);

    $scope.selectSubsidyTemplate = async function(){
        $ionicPopup.show({
            title:'出差补助选择',
            cssClass:'selectSubsidy',
            template:require('./selectSubsidy.html'),
            scope: $scope,
            buttons:[
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        try{
                            if(!$scope.subsidy.template){
                                e.preventDefault();
                                msgbox.log("请选择补助模板");
                                return false;
                            }else{
                                $scope.select_subsidy = $scope.subsidy.template;
                            }
                        }catch(err){
                            msgbox.log(err.msg || err);
                        }
                    }
                }
            ]
        });
    }

    /*******************出差补助选择end************************/

    $scope.addDestination = async function(){
        let option = $scope.placeSelector;
        $scope.trip.reason ='';
        option.title = '目的地选择';
        let city = await ngModalDlg.selectCity($scope,option,$scope.trip.destination);
        if(city){
            $scope.trip.destination = city;
            $scope.trip.hotelPlaceObj = undefined;
            $scope.trip.hotelPlace = undefined;
            $scope.trip.hotelName = undefined;
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
        display: (item)=> {
            if (item.isAbroad && item.code) {
                return `${item.name}(${item.code})`;
            }
            return item.name
        }
    };
    $scope.complete = function(){
        let trip = $scope.trip;
        if(!trip.destination || !trip.destination.id) {
            $scope.showErrorMsg('请填写出差目的地！');
            return false;
        }

        if(!trip.reasonName) {
            $scope.showErrorMsg('请填写出差事由！');
            return false;
        }

        if(moment(trip.endDate).toDate().getTime() - moment(trip.beginDate).toDate().getTime() <= 0) {
            $scope.showErrorMsg('到达时间不可晚于离开时间！');
            return false;
        }
        if ($scope.currentTpSts && $scope.currentTpSts.length && (!$scope.subsidy || !$scope.subsidy.template)) {
            $scope.showErrorMsg('请选择补助信息');
            return false;
        }
        $scope.confirmModal({trip:trip,subsidy:$scope.subsidy})
    }
}