'use strict';

import angular = require('angular');
const API = require('api');

class Staff {
    constructor(){

    }
}

class StaffCache {
    cache : angular.ICacheObject;
    constructor($cacheFactory){
        this.cache = $cacheFactory('StaffCache');
        API.require('staff');
    }

    async $resolve() : Promise<this> {
        await API.onload();
        return this;
    }

    async get(id: string) : Promise<Staff> {
        var self = this;
        var staff : Staff = self.cache.get<Staff>(id);
        if(staff)
            return staff;
        staff = await API.staff.getCurrentStaff();
        self.cache.put(id, staff);
        return staff;
    }

}

class CityInfo {
    id: string;
    code: string;
    name: string;
}

class PlaceCache {
    idmap = new Map<string, CityInfo>();
    codemap = new Map<string, CityInfo>();
    constructor(){
        API.require('place');
    }

    async $resolve() : Promise<this> {
        await API.onload();
        return this;
    }

    async get(code: string) : Promise<CityInfo> {
        var self = this;
        var city = self.codemap.get(code);
        if(city)
            return city;
        city = await API.place.getCityInfo({cityCode: code});
        self.codemap.set(code, city);
        return city;
    }
}

angular.module('qm.model', [])
    .service('StaffCache', StaffCache)
    .service('PlaceCache', PlaceCache);