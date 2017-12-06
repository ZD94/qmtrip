import { requireParams, clientExport } from '@jingli/dnode-api/dist/src/helper';
import { restfulAPIUtil } from '../restful'
var _ = require("lodash");
export default class PlaceModule {

    @clientExport
    @requireParams(['id'])
    static async getCityById(id) {
        let city :any = {};
        if(/^[a-zA-Z0-9_]+$/.test(id)){
            city = await restfulAPIUtil.operateOnModel({
                model: `place`,
                params: {
                    method: 'GET',
                    fields: {id}
                }
            });
            return city.data;
        } 
        city = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: {name: id}
            },
            addUrl: "getCityInfoByName"
        });
        if(_.isArray(city.data)){
            return city.data[0];
        } 
        return city.data;

    }

    @clientExport
    static async findByKeyword(keyword: string) {
        let city = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: {}
            },
            addUrl: `search/${keyword}`
            // addUrl: `search/${encodeURIComponent(keyword)}`
        });
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
        return cities.data;
    }

    @clientExport
    static async getCityInfoByName(params){
        let cities = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: params
            },
            addUrl: `getCityInfoByName`
        });
        if(typeof cities.data == 'string'){
            cities.data = JSON.parse(cities.data);
        }
        if(_.isArray(cities.data)){
            return cities.data[0]
        }
        return cities.data;
    }

    @clientExport
    static async getAirPortsByCity(params){
        let airports = await restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: params
            },
            addUrl: 'getAirPortsByCity'
        });
        return airports.data;
    }

    @clientExport
    static async getCityInfo(params){
        let {cityCode } = params;
        let city = await  PlaceModule.getCityById(cityCode);
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
            addUrl: 'search/'  //=等字符表示不设，用于匹配find的路径
        });
        return cities.data;
    }

    @clientExport 
    static async queryCity(params: {keyword?: number|string, isAbroad: boolean, max?: number }){
   
        let {keyword, isAbroad, max} = params;
        let addUrl = '';
        let query: {[index: string]: any} = {};
        query.isAbroad = isAbroad;
        query.limit = max;
        if(/[a-zA-Z0-9]+/.test(JSON.stringify(keyword))){
            addUrl = `search/${keyword}`;
            // query.letter = keyword;   //老版的place会调用common-api中的queryCity,只需要传一个keyword, 新版需要分开传
            // query.pinyin = keyword;
        } else {
            addUrl = `getCityInfoByName`;
            query.name = keyword;
        }

        let cities = await  restfulAPIUtil.operateOnModel({
            model: `place`,
            params: {
                method: 'GET',
                fields: query
            },
            addUrl: addUrl
        }); 
        //兼容老版common-api的getCitiesbyLetter返回的数据结构为 {total: number, cities: []}
        if(_.isArray(cities.data)){
            return cities.data;
        }
        return [cities.data];
    }

}