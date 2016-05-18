
import { CachedService, requireAPI } from 'common/model';
import { Department } from 'api/_types/department';
import ApiDepartment = require('api/department');

export class DepartmentService extends CachedService<Department>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('department'));
    }

    async $create(obj: Object): Promise<Department>{
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.createDepartment(obj);
    }
    async $get(id: string): Promise<Department>{
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.getDepartment({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.getDepartments(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiDepartment>('department');
        fields[id] = id;
        return api.updateDepartment(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.deleteDepartment({id: id});
    }
}
