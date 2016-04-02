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
        this.cache = $cacheFactory('Staff');
    }

    $resolve() : Promise<void> {
      API.require('staff');
      return API.onload();
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

angular.module('qmmodel', [])
    .service('StaffCache', StaffCache);

export = function($module){
}