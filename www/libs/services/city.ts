/**
 * Created by wlh on 2016/11/1.
 */

'use strict';
import {Place} from "_types/place";

angular
.module('nglibs')
.service('City', function() {
    this.getCity = async function (cityCode: string, readCache: boolean = true) {
        if (readCache) {
            let allCities = await getAllCities();
            if (allCities && allCities[cityCode]) return allCities[cityCode];
        }
        if(cityCode){
            return API.place.getCityInfo({cityCode: cityCode});
        }else{
            return null;
        }
    }

    async function getAllCities() {
        let key = 'all_cities';
        let allCities: any = localStorage.getItem(key);
        try {
            allCities = JSON.parse(allCities);
        } catch(err) {
            allCities = null;
        }
        if (!allCities) {
            API.require('place');
            await API.onload();
            let arrAllCities = await API.place.getAllCities({type: 2});
            allCities = {};
            arrAllCities.forEach( (v: Place) => {
                allCities[v.id] = v;
            });
            if (Object.keys(allCities)) {
                localStorage.setItem(key, JSON.stringify(allCities))
            }
        }
        try {
            allCities = JSON.parse(allCities);
        } catch(err) {
            allCities = null;
        }
        return allCities;
    }
})