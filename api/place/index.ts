import { requireParams, clientExport } from '@jingli/dnode-api/dist/src/helper';
import { restfulAPIUtil } from '../restful'

export default class PlaceModule {

    @clientExport
    @requireParams(['id'])
    static async getCityById(id) {
        const city = await restfulAPIUtil.operateOnModel({
            model: `/place/${id}`,
            params: {
                method: 'GET'
            }
        });
        return city;
    }

    @clientExport
    static async findByKeyword(keyword: string) {
        return await restfulAPIUtil.operateOnModel({
            model: `/place/search/${encodeURIComponent(keyword)}`,
            params: {
                method: 'GET'
            }
        });
    }

    @clientExport
    static async findSubCities(parentId: string) {
        return await restfulAPIUtil.operateOnModel({
            model: `/place/${parentId}/children`,
            params: {
                method: 'GET'
            }
        });
    }

    @clientExport
    static async findNearCitiesByGC(longitude: number, latitude: number) {
        return await restfulAPIUtil.operateOnModel({
            model: `/place/nearby/${longitude}/${latitude}`,
            params: {
                method: 'GET'
            }
        });
    }

    static async getCitiesByLetter(params: {isAbroad?: boolean, letter?: string, limit?: number, page?: number, type: number}){
        return restfulAPIUtil.operateOnModel({
            model: `/place/getCitiesByLetter`,
            params: {
                method: 'GET',
                fields: params
            }
        });
    }


    static async getCityInfoByName(params){

        return restfulAPIUtil.operateOnModel({
            model: `/place/getCityInfoByName`,
            params: {
                method: 'GET',
                fields: params
            }
        });
    }

    static async getAirPortsByCity(params){
        
        return restfulAPIUtil.operateOnModel({
            model: `/place/getAirPortsByCity`,
            params: {
                method: 'GET',
                fields: params
            }
        });
    }

}