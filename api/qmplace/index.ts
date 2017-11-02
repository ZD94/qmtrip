import { requireParams, clientExport } from '@jingli/dnode-api/dist/src/helper';
import { restfulAPIUtil } from '../restful'

export default class PlaceModule {

    @clientExport
    @requireParams(['id'])
    static async getCityById(id) {
        const city = await restfulAPIUtil.proxyHttp({
            url: `/place/${id}`,
            method: 'GET'
        });
        return city;
    }

    @clientExport
    static async findByKeyword(keyword: string) {
        return await restfulAPIUtil.proxyHttp({
            url: `/place/search/${encodeURIComponent(keyword)}`,
            method: 'GET'
        })
    }

    @clientExport
    static async findSubCities(parentId: string) {
        return await restfulAPIUtil.proxyHttp({
            url: `/place/${parentId}/children`,
            method: 'GET'
        })
    }

    @clientExport
    static async findNearCitiesByGC(longitude: number, latitude: number) {
        return await restfulAPIUtil.proxyHttp({
            url: `/place/nearby/${longitude}/${latitude}`,
            method: 'GET'
        })
    }

}