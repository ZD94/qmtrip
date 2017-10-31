import { requireParams, clientExport } from '@jingli/dnode-api/dist/src/helper';
import { restfulAPIUtil } from '../restful'

export default class PlaceModule {

    @clientExport
    @requireParams(['id'])
    static async getCityById(id) {
        const city = await restfulAPIUtil.proxyHttp({
            url: `/city/${id}`,
            method: 'GET'
        });
        return city;
    }

    @clientExport
    static async findByKeyword(keyword: string) {
        return await restfulAPIUtil.proxyHttp({
            url: `/city`,
            method: 'GET',
            qs: { keyword }
        })
    }

    @clientExport
    static async findSubCities(parentId: string) {
        return await restfulAPIUtil.proxyHttp({
            url: `/city/${parentId}/children`,
            method: 'GET'
        })
    }

    @clientExport
    static async findNearCitiesByGC(longitude: number, latitude: number) {
        return await restfulAPIUtil.proxyHttp({
            url: `/city/nearby/${longitude}/${latitude}`,
            method: 'GET'
        })
    }

}