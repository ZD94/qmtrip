
var API = require('api');

import { Company } from 'api/client/company/company.types';
import { Staff as IStaff } from 'api/client/staff/staff.types';

import {getServices, ngService} from './index';
import { CachedService } from './cached';
import {CompanyService} from "./company";

class Staff extends IStaff{
    private company: Company;
    
    constructor(obj) {
        super(obj);
    }

    getCompany() {
        return this.company;
    }

    async $resolve() {
        var CompanyService = getServices<CompanyService>('CompanyService');
        this.company = await CompanyService.get(this.companyId);
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
        var staff = await staff_api.getStaff({id: id});
        await staff.$resolve();
        return staff;
    }

}
