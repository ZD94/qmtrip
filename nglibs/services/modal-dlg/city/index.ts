/**
 * Created by seven on 2017/3/7.
 */
"use strict";

var jquery= require('jquery');
import _ = require('lodash');

export async function selectCityListController($scope, $storage, $ionicScrollDelegate){
    require("./dialog.scss");
    $scope.searchBegin = false;
    $scope.abroadCities = [];//所有国际城市数据
    $scope.domesticCities = [];//所有国内城市数据
    let history = await $storage.local.get('history_city');

    if(history){
        $scope.history_city = history;
    }else{
        $scope.history_city = [];
    }
    $scope.isAbroad = false;
    $scope.keyList = await $scope.options.queryAll(null, $scope.isAbroad);
    $scope.hotCities = $scope.keyList.slice(0,10);
    let abroadIdx = 0;
    let domesticIdx = 0;
    $scope.checkAbroad = async function(abroad){
        $scope.abroadlist = [];
        $scope.domesticlist = [];
        abroadIdx = 0;
        domesticIdx = 0;
        if(abroad){
            //这里获取国际列表
            $scope.isAbroad = true;
            $scope.keyList = await $scope.options.queryAll(null, $scope.isAbroad);
            $scope.hotCities = $scope.keyList.slice(0,10);
            $ionicScrollDelegate.scrollTop();
            let abroadCities = $scope.abroadCities = await $scope.options.queryAbroad();
            $scope.pages.getCityList(abroadCities);
            let top = 0;
            let abroad = [];
            abroad = abroadCities.map(function(city, idx){
                city.top = {top:top+'px'};
                top = top + 20 + city.cities.length*41;
                return city;
            });

        }else{
            //这里获取国内列表
            $scope.isAbroad = false;
            $scope.keyList = await $scope.options.queryAll(null, abroad);
            $scope.hotCities = $scope.keyList.slice(0,10);
            $ionicScrollDelegate.scrollTop();
            let domesticCities = $scope.domesticCities = await $scope.options.queryDomestic();
            $scope.pages.getCityList(domesticCities);
            let intertop = 0;
            let domestic = [];
            domestic = domesticCities.map(function(city, idx){
                city.top = {top:intertop+'px'};
                intertop = intertop + 20 + city.cities.length*41;
                return city;
            });
        }
    }
    $scope.checkAbroad($scope.isAbroad);
    $scope.pages = {
        hasNextIndex(){
            if($scope.isAbroad) {
                return $scope.abroadCities.length - abroadIdx;
            }else {
                return $scope.domesticCities.length - domesticIdx;
            }
        },
        getCityList(list){

            list.sort(function(pre,current){
                return pre.first_letter.charCodeAt(0) - current.first_letter.charCodeAt(0);
            });

            if($scope.isAbroad){
                let total = 0;
                while(list && list.length && total <50){
                    if(!$scope.abroadlist) {
                        $scope.abroadlist = list[abroadIdx];
                    }else{
                        $scope.abroadlist = _.concat($scope.abroadlist, list[abroadIdx]);
                    }
                    total += list[abroadIdx].cities.length;
                    abroadIdx++;
                    if (abroadIdx >= list.length) break;
                }
            }else {
                let total = 0;
                while(list && list.length && total <50){
                    if(!$scope.domesticlist){
                        $scope.domesticlist = list[domesticIdx];
                    }else{
                        $scope.domesticlist = _.concat($scope.domesticlist, list[domesticIdx]);
                    }
                    total += list[domesticIdx].cities.length;
                    domesticIdx++;
                    if (domesticIdx >= list.length) break;
                }
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    }
    $scope.confirm = async function(value){
        const MAX_HISTORY_LENGTH = 5;
        if(!history){
            history = [];
        }
        for (let i=0, ii=history.length;i <ii; i++){
            let city  = history[i];
            if(city && city.id == value.id){
                history.splice(i, 1);
            }
        }
        history.unshift(value);
        while(history.length > MAX_HISTORY_LENGTH) {
            history.pop();
        }
        $storage.local.set('history_city',history);
        $scope.confirmModal(value);
    }
    $scope.queryCity = async function(keyword){
        $scope.keyList = await $scope.options.queryAll(keyword);
    }
    $scope.showSearchList = function(){
        $scope.searchBegin = true;
    }
    $scope.hideSearchList = function(){
        $scope.searchBegin = false;
    }
}