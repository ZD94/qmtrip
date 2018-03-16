import { requireParams, clientExport } from '@jingli/dnode-api/dist/src/helper';
import { restfulAPIUtil } from '../restful'
var _ = require("lodash");
const cache = require("common/cache")
const cityPrefix = 'city:info:id:v3'
export default class PlaceModule {

    @clientExport
    @requireParams(['id'])
    static async getCityById(id: string, companyId?: string) {
        if(!id) return null;
        let city :any = await cache.read(`${cityPrefix}:${id}`)
        if(typeof city == 'string') 
            city = JSON.parse(city)
        if(city) return city;
        if(/^[a-zA-Z0-9_]+$/.test(id)){
            city = await restfulAPIUtil.operateOnModel({
                model: `place`,
                params: {
                    method: 'GET',
                    fields: {id, companyId}
                }
            });
            if (!city || !city.data) return null;
            await cache.write(`${cityPrefix}:${id}`, JSON.stringify(city.data));
            return city.data;
        } 
        city = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: {keyword: id, companyId: companyId}
            },
            addUrl: "search"
        });    
        if(!city || !city.data) return null;
        if(_.isArray(city.data)){
            await cache.write(`${cityPrefix}:${id}`, JSON.stringify(city.data[0]));
            return city.data[0];
        } 
        await cache.write(`${cityPrefix}:${id}`, JSON.stringify(city.data));
        return city.data;

    }

    @clientExport
    static async findByKeyword(keyword: string) {
        let city = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: {keyword}
            },
            addUrl: `search`
        });
        if(!city || !city.data) return null;
        return city.data;
    }

    @clientExport
    static async findSubCities(parentId: string) {
        let subcities = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: {}
            },
            addUrl: `${parentId}/children`
        });
        if(!subcities || !subcities.data) return null;
        return subcities.data;
    }

    @clientExport
    static async findNearCitiesByGC(longitude: number, latitude: number) {
        let neighbors = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: {}
            },
            addUrl: `nearby/${longitude}/${latitude}`
        });
        if(!neighbors || !neighbors.data) return null;
        return neighbors.data;
    }

    @clientExport
    static async getCitiesByLetter(params: {isAbroad?: boolean, letter?: string, limit?: number, page?: number, type: number}){
        let cities = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: params
            },
            addUrl: 'getCitiesByLetter'
        });
        if(!cities || !cities.data) return null;
        return cities.data;
    }

    @clientExport
    static async getCityInfoByName(params: {name?: string}){
        let cities = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: {keyword: params.name}
            },
            addUrl: `search`
        });
        if(typeof cities.data == 'string'){
            cities.data = JSON.parse(cities.data);
        }
        if(!cities || !cities.data) return null;
        if( _.isArray(cities.data)){
            return cities.data[0]
        }
        return cities.data;
    }

    @clientExport
    static async getAirPortsByCity(params: {id: string}){
        let airports = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: params
            },
            addUrl: 'getAirPortsByCity'
        });
        if(!airports || !airports.data) return null;
        return airports.data;
    }

    @clientExport
    static async getCityInfo(params: {cityCode: string, companyId?: string}){
        let { cityCode, companyId } = params;
        let city = await  PlaceModule.getCityById(cityCode, companyId);
        return city;

    }

    @clientExport
    static async queryHotCity(params: {limit?: number, isAbroad: boolean }){
        let cities = await  restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: {}
            },
            addUrl: 'search'  //=等字符表示不设，用于匹配find的路径
        });
        if(!cities || !cities.data) return null;
        return cities.data;
    }

    @clientExport 
    static async queryCity(params: {keyword?: number|string, isAbroad: boolean, max?: number }){
        let addUrl = 'search';
        let cities = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: {
                    keyword: params.keyword
                }
            },
            addUrl: addUrl
        }); 
        //兼容老版common-api的getCitiesbyLetter返回的数据结构为 {total: number, cities: []}
        if(!cities || !cities.data) return null;
        if(_.isArray(cities.data)){
            return cities.data;
        }
        return [cities.data];
    }

}