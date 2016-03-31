'use strict';

var angular = require('angular');
var API = require('api');

class Staff {
    constructor(){

    }
}

class StaffCache {
    cache : angular.ICacheObject;
    constructor($cacheFactory){
        API.require('staff');
        this.cache = $cacheFactory('Staff');
    }

    async get(id: string) : Promise<Staff> {
        var self = this;
        var staff : Staff = self.cache.get<Staff>(id);
        if(staff)
            return staff;
        await API.onload();
        staff = await API.staff.getCurrentStaff();
        self.cache.put(id, staff);
        return staff;
    }
}

angular.module('qmmodel', [])
    .service('StaffCache', StaffCache);

export = function($module){
}