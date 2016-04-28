
var API = require('api');

import { Company as ICompany } from 'api/client/company/company.types';
import { Staff } from 'api/client/staff/staff.types';

import {getServices, ngService} from './index';
import {StaffService} from "./staff";
import { CachedService } from './cached';

export class Company extends ICompany {
    constructor(obj) {
        super(obj);
    }

    async getStaffs(): Promise<Staff[]> {
        var StaffService = getServices<StaffService>('StaffService');
        var company_api = require('api/client/company');
        return company_api.getStaffs()
            .map(function(staff: Staff){
                return staff.id;
            })
            .map(function(id: string){
                return StaffService.get(id);
            });
    }
}

@ngService('CompanyService')
export class CompanyService extends CachedService<Company> {
    constructor(){
        super('CompanyService');
        API.require('company');
    }

    async $get(id: string) : Promise<Company> {
        var company_api = require('api/client/company');
        return company_api.getCompanyById({companyId: id});
    }
}
