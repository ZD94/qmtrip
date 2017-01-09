/**
 * Created by seven on 2016/12/29.
 */
"use strict";
var jquery= require('jquery');
import _ = require('lodash');

export async function selectCityListController($scope, $storage, $ionicScrollDelegate){
    require("./dialog.scss");
    $scope.searchBegin = false;
    let history = await $storage.local.get('history_city');
    $scope.keyList = await $scope.options.queryAll();
    $scope.hotCities = $scope.keyList.slice(0,10);
    if(history){
        $scope.history_city = history;
    }else{
        $scope.history_city = [];
    }
    $scope.isAbroad = false;
    $scope.abroadlist = [];
    let abroadIdx = 0;
    let internalIdx = 0;
    $scope.checkAbroad = async function(abroad){
        $scope.abroadlist = [];
        $scope.internallist = [];
        abroadIdx = 0;
        internalIdx = 0;
        if(abroad){
            //这里获取国际列表
            $scope.isAbroad = true;
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
            $ionicScrollDelegate.scrollTop();
            let internalCities = $scope.internalCities = await $scope.options.queryInternal();
            $scope.pages.getCityList(internalCities);
            let intertop = 0;
            let internal = [];
            internal = internalCities.map(function(city, idx){
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
                return $scope.internalCities.length - internalIdx;
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
                    if(!$scope.internallist){
                        $scope.internallist = list[internalIdx];
                    }else{
                        $scope.internallist = _.concat($scope.internallist, list[internalIdx]);
                    }
                    total += list[internalIdx].cities.length;
                    internalIdx++;
                    if (internalIdx >= list.length) break;
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