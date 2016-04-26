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

class Menuitem {
    icon:string;
    title:string;
    link:string;
    badgenum:number;
}
class Menu {
    menus:Menuitem[] = [];
    notie:boolean;
    get() :any {
        var self = this;
        return self.menus;

    }
    getone(title:string) :any {
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==title) {
                return self.menus[i];
            }
        }

    }
    del(title:string) {
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==title) {
                self.menus.splice(i,1);
                return true;
            }
        }
        return undefined;
    }
    add(item:Menuitem) {
        var self = this;
        self.menus.push(item);
        return self.menus;
    }
    set(item:Menuitem) :Menuitem {
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==item.title) {
                return self.menus[i] = item;
            }
        }
        return undefined;
    }
    badge(item:Menuitem) {
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==item.title) {
                self.menus[i].badgenum +=1;
                return self.menus[i];
            }
        }
    }
    newnotice(boolean:boolean) {
        var self = this;
        self.notie = boolean;
        return self.notie;
    }
}
angular.module('qm.model', [])
    .service('StaffCache', StaffCache)
    .service('PlaceCache', PlaceCache)
    .service('Menu', Menu);