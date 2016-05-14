/**
 * Created by wlh on 16/5/14.
 */

import { CachedService, requireAPI } from 'api/_types';
import {Place} from 'api/_types/place'

import ApiPlace = require("./index")

export class PlaceService extends CachedService<Place> {
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('place'));
    }

    async $create(obj:Object):Promise<Place> {
        throw new Error("not support")!
    }

    async $get(id:string):Promise<Place> {
        let api = await requireAPI<typeof ApiPlace>("place");
        return api.getCityInfo({cityCode: id});
    }

    async $find(where:any):Promise<string[]|Place[]> {
        let api = await requireAPI<typeof ApiPlace>("place");
        let keyword = where.keyword;
        return api.queryPlace({keyword: keyword});
    }

    $update(id:string, fields:Object):Promise<any> {
        throw new Error("not support!");
    }

    $destroy(id:string):Promise<any> {
        throw new Error("not support!");
    }

    async hotCities(where: {limit: number}) : Promise<string[]|Place[]> {
        let api = await requireAPI<typeof ApiPlace>("place");
        let limit = where.limit || 20;
        return api.hotCities({limit: limit});
    }

    async hotBusinessDistricts(where: {limit: number, cityId: string}): Promise<string[]|Place[]> {
        let api = await requireAPI<typeof ApiPlace>("place");
        let limit = where.limit;
        let cityId = where.cityId;
        return api.hotBusinessDistricts({limit: limit, cityId: cityId});
    }

}