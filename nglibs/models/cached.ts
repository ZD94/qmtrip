
var API = require('api');

import * as ng from 'angular';
import {getServices} from './index';

interface ResolvableOrNot {
    $resolve?: () => Promise<any>;
}

export abstract class CachedService<T extends ResolvableOrNot> {
    abstract $get(id: string) : Promise<T>;

    cache : ng.ICacheObject;
    constructor(cacheName: string){
        var $injector = angular.injector(['ng']);
        var $cacheFactory = $injector.get<ng.ICacheFactoryService>('$cacheFactory');
        this.cache = $cacheFactory(cacheName);
    }

    async $resolve() : Promise<this> {
        await API.onload();
        return this;
    }

    async get(id: string) : Promise<T> {
        var self = this;
        var staff = self.cache.get<T>(id);
        if(staff)
            return staff;
        staff = await this.$get(id);
        if(typeof staff.$resolve == 'function') {
            await staff.$resolve();
        }
        self.cache.put(id, staff);
        return staff;
    }
}
