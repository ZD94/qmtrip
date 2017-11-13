import { requireParams, clientExport } from '@jingli/dnode-api/dist/src/helper';
import { restfulAPIUtil } from '../restful'

export default class PlaceModule {

    @clientExport
    @requireParams(['id'])
    static async getCityById(id) {
        let city = await restfulAPIUtil.operateOnModel({
            model: `/place/${id}`,
            params: {
                method: 'GET',
                fields: {}
            }
        });
        return city.data;
    }

    @clientExport
    static async findByKeyword(keyword: string) {
        let city = await restfulAPIUtil.operateOnModel({
            model: `/place/search/${encodeURIComponent(keyword)}`,
            params: {
                method: 'GET',
                fields: {}
            }
        });
        return city.data;
    }

    @clientExport
    static async findSubCities(parentId: string) {
        let subcities = await restfulAPIUtil.operateOnModel({
            model: `/place/${parentId}/children`,
            params: {
                method: 'GET',
                fields: {}
            }
        });
        return subcities.data;
    }

    @clientExport
    static async findNearCitiesByGC(longitude: number, latitude: number) {
        let neighbors = await restfulAPIUtil.operateOnModel({
            model: `/place/nearby/${longitude}/${latitude}`,
            params: {
                method: 'GET',
                fields: {}
            }
        });

        return neighbors.data;
    }

    @clientExport
    static async getCitiesByLetter(params: {isAbroad?: boolean, letter?: string, limit?: number, page?: number, type: number}){
        let cities = await restfulAPIUtil.operateOnModel({
            model: `/place/getCitiesByLetter`,
            params: {
                method: 'GET',
                fields: params
            }
        });
        return cities.data;
    }

    @clientExport
    static async getCityInfoByName(params){

        let cities = await restfulAPIUtil.operateOnModel({
            model: `/place/getCityInfoByName`,
            params: {
                method: 'GET',
                fields: params
            }
        });
        return cities.data;
    }

    @clientExport
    static async getAirPortsByCity(params){
        let airports = await restfulAPIUtil.operateOnModel({
            model: `/place/getAirPortsByCity`,
            params: {
                method: 'GET',
                fields: params
            }
        });
        return airports.data;
    }

    @clientExport
    static async getCityInfo(params){
        let {cityCode } = params;
        let city = await  PlaceModule.getCityById(cityCode);
        console.log("city: ", city);
        return city;

    }

    @clientExport
    static async queryHotCity(params: {limit?: number, isAbroad: boolean }){
        let cities = await  restfulAPIUtil.operateOnModel({
            model: `/place`,
            params: {
                method: 'GET',
                fields: params
            }
        });
        return cities.data;
    }

    @clientExport
    static async queryCity(params: {keyword?: number, isAbroad: boolean, max?: number }){
        let cities = await  restfulAPIUtil.operateOnModel({
            model: `/place`,
            params: {
                method: 'GET',
                fields: params
            }
        });
        return cities.data;
    }

}