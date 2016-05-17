
import { CachedService, requireAPI } from 'common/model';
import { Company, MoneyChange } from 'api/_types/company';
import ApiCompany = require('api/company');

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
        return api.getCompany({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.listCompany(where);
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

export class MoneyChangeService extends CachedService<MoneyChange>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('moneyChange'));
    }

    async $create(obj: any): Promise<MoneyChange>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.saveMoneyChange(obj);
    }
    async $get(id: string): Promise<MoneyChange>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.getMoneyChange({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.listMoneyChange(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        throw {code: -2, msg: '不能更新记录'};
    }
    async $destroy(id: string): Promise<any> {
        throw {code: -2, msg: '不能删除记录'};
    }
}