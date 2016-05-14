import { CachedService, requireAPI } from 'api/_types';
import {TripPlan, TripDetail, Project} from 'api/_types/tripPlan';
import ApiTripPlan = require('api/client/tripPlan');

export class TripPlanService extends CachedService<TripPlan>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('tripPlan'));
    }

    async $create(obj: any): Promise<TripPlan> {
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.saveTripPlan(obj);
    }

    async $get(id: string): Promise<TripPlan>{
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.getTripPlanById({orderId: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.pageTripPlans(where);
    }
    async $update(id: string, fields: any): Promise<any> {
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        fields['orderId'] = id;
        return api.updateTripPlanOrder(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.deleteTripPlan({orderId: id});
    }
}

export class TripDetailService extends CachedService<TripDetail>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('tripDetail'));
    }

    async $create(obj: any): Promise<TripDetail> {
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.saveTripPlan(obj);
    }

    async $get(id: string): Promise<TripDetail>{
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.getTripPlanById({orderId: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.pageTripPlans(where);
    }
    async $update(id: string, fields: any): Promise<any> {
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        fields['orderId'] = id;
        return api.updateTripPlanOrder(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.deleteTripPlan({orderId: id});
    }
}

export class ProjectService extends CachedService<Project>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('project'));
    }

    async $create(obj: any): Promise<Project> {
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.createNewProject(obj);
    }

    async $get(id: string): Promise<Project>{
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.getProjectById({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.getProjectsList(where);
    }
    async $update(id: string, fields: any): Promise<any> {
        throw {code: -1, msg: '不能更新项目名称'};
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiTripPlan>('tripPlan');
        return api.deleteProject({id: id});
    }
}