
var API = require('api');

import { Company } from 'api/client/company/company.types';
import { Staff as IStaff } from 'api/client/staff/staff.types';

import {getServices, ngService} from './index';
import { CachedService } from './cached';
import {CompanyService} from "./company";

class Staff extends IStaff{
    company: Company;
    
    constructor(obj) {
        super(obj);
    }

    async getCompany(): Promise<Company> {
        var CompanyService = getServices<CompanyService>('CompanyService');
        this.company = await CompanyService.get(this.companyId);
        return this.company;
    }
}

@ngService('StaffService')
export class StaffService extends CachedService<Staff> {
    constructor(){
        super('StaffCache');
        API.require('staff');
    }

    async $get(id: string) : Promise<Staff> {
        var staff_api = require('api/client/staff');
        return staff_api.getStaff({id: id});
    }

}
