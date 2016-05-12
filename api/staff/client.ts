
import { CachedService, requireAPI } from '../_types/index';
import { Staff } from '../_types/staff';
import * as ApiStaff from 'api/client/staff';

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
