import { CachedService, requireAPI } from 'common/model';
import { AgencyUser, Agency } from 'api/_types/agency';
import ApiAgency = require('api/client/agency');

export class AgencyService extends CachedService<Agency>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('agency'));
    }

    async $create(obj: {name: string, email: string, mobile: string, userName: string, description?: string,
        remark?: string, pwd?: string}): Promise<Agency>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.createAgency(obj);
    }
    async $get(id: string): Promise<Agency>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.getAgencyById({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.listAgency(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        fields[''] = id;
        return api.updateAgency(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.deleteAgency({agencyId: id});
    }
}

export class AgencyUserService extends CachedService<AgencyUser>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('agencyuser'));
    }

    async $create(obj: any): Promise<AgencyUser>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.createAgencyUser(obj);
    }
    async $get(id: string): Promise<AgencyUser>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.getAgencyUser({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.listAndPaginateAgencyUser(where);
    }
    async $update(id: string, fields: {id: string, status?: number, name?: string, sex?: string, email?: string,
        mobile?: string, avatar?: string, roleId?: string}): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        fields['id'] = id;
        return api.updateAgencyUser(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.deleteAgencyUser({userId: id});
    }
}
