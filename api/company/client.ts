
import { CachedService, requireAPI } from '../_types/index';
import { Company } from '../_types/company';
import ApiCompany = require('api/client/company');

export class CompanyService extends CachedService<Company>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('company'));
    }

    async $create(obj: {mobile: string, name: string, email: string, userName: string, domain: string, pwd?: string, remark?: string, description?: string}): Promise<Company>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.createCompany(obj);
    }
    async $get(id: string): Promise<Company>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.getCompanyById({companyId: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.getCompanyListByAgency(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiCompany>('company');
        fields['id'] = fields;
        return api.updateCompany(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.deleteCompany({companyId: id});
    }
}
