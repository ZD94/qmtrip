
import { CachedService, requireAPI } from 'api/_types';
import { Staff, Credential } from 'api/_types/staff';
import ApiStaff = require('api/client/staff');

export class StaffService extends CachedService<Staff>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('staff'));
    }

    async $create(obj: Object): Promise<Staff>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.createStaff(obj);
    }
    async $get(id: string): Promise<Staff>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.getStaff({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.getStaffs(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiStaff>('staff');
        fields['id'] = id;
        return api.updateStaff(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.deleteStaff({id: id});
    }
}

export class CredentialService extends CachedService<Credential>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('credential'));
    }

    async $create(obj: Object): Promise<Credential>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.createPapers(obj);
    }
    async $get(id: string): Promise<Credential>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.getPapersById({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.getOnesPapers(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiStaff>('staff');
        fields['id'] = id;
        return api.updatePapers(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.deletePapers({id: id});
    }
}
