/**
 * Created by seven on 2016/12/27.
 */
"use strict";
declare var API;
export async function TestCityController($scope, $storage){
    API.require('tripPlan');
    $scope.fromPlace='';
    await API.onload();
    $scope.fromPlaceSelector = {
        queryAll: queryAllPlaces,
        queryAbroad: queryAbroadPlaces,
        queryInternal: queryInternalPlaces,
        display: (item)=>item.name
    };
    async function queryAllPlaces(keyword){
        if (!keyword) {
            let hotCities = $storage.local.get("hot_cities")
            if (hotCities && hotCities[0] && hotCities[0].id) {
                return hotCities;
            }
        }
        var places = await API.place.queryPlace({keyword: keyword});
        if (!keyword) {
            $storage.local.set('hot_cities', places);
        }
        return places;
    }
    async function queryAbroadPlaces(){
        let abroad = $storage.local.get('abroad_cities');
        if(!abroad){
            abroad = await API.place.queryCitiesGroupByLetter({isAbroad:true});
            $storage.local.set('abroad_cities',abroad);
        }
        return abroad;
    }
    async function queryInternalPlaces(){
        let internal = $storage.local.get('internal_cities');
        if(!internal){
            internal = await API.place.queryCitiesGroupByLetter({isAbroad:false});
            $storage.local.set('internal_cities',internal);
        }
        return internal;
    }
}