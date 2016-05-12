import { CachedService, requireAPI } from '../_types/index';
import { TravelPolicy } from '../_types/travelPolicy';
import * as ApiTravelPolicy from 'api/client/travelPolicy';

export class TravelPolicyService extends CachedService<TravelPolicy>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('travelPolicy'));
    }

    async $create(obj: Object): Promise<TravelPolicy>{
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.createTravelPolicy(obj);
    }
    async $get(id: string): Promise<TravelPolicy>{
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.getTravelPolicy({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.getTravelPolicies(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        fields[id] = id;
        return api.updateTravelPolicy(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.deleteTravelPolicy({id: id});
    }
}
