
import _ = require('lodash');

import { initModels } from 'api/_types';

import StaffModule = require('api/staff');
import DepartmentModule = require ('api/department');
import TravelPolicyModule = require('api/travelPolicy');
import { ServiceInterface, ServiceAbstract } from 'common/model';
import { Staff, Credential, PointChange } from 'api/_types/staff';
import { Company, MoneyChange } from './_types/company';
import { Department } from './_types/department';
import { TravelPolicy } from './_types/travelPolicy';
import { Agency, AgencyUser } from './_types/agency';
import {TripPlan, TripDetail, Project, TripPlanLog} from './_types/tripPlan';
import { Account,Token } from './_types/auth';
import { Seed } from './_types/seed';
import { CachedService, CacheInterface, Resolvable } from '../common/model/service';
import { createCache } from './_cache';

class SequelizeService<T extends Resolvable> extends CachedService<T>{
    constructor(cache: CacheInterface, TClass:any){
        super(cache, TClass);
    }

    create(obj: Object): T {
        var ret = super.create(obj);
        ret.target = this.TClass.$sqlmodel.build(ret['$fields']);
        ret['$fields'] = {'!':'!'};
        return ret;
    }
    async $get(id: string): Promise<T>{
        var target = await this.TClass.$sqlmodel.findById(id);
        return new this.TClass(target);
    }
    async $find(where: any): Promise<T[]>{
        var [rows, count] = await this.TClass.$sqlmodel.findAndCount(where);
        var objs = rows.map((row)=>new this.TClass(row));
        return objs;
    }
    async $update(obj: T, fields: Object): Promise<Object>{
        try{
            await obj.target.update(fields);
            return obj.target;
        } catch(e) {
            //出错后,需要将之前设置的fields恢复成之前的样子
            var previous = obj.target.previous();
            for(let k in previous) {
                obj.target.set(k, previous[k]);
            }
            throw e;
        }
    }
    $destroy(obj: T): Promise<any> {
        return obj.target.destroy();
    }
}
function createServerService<T extends Resolvable>(TClass: any){
    var cache = createCache(TClass.name);
    return new SequelizeService<T>(cache, TClass);
}

initModels({
    staff: createServerService<Staff>(Staff),
    credential: createServerService<Credential>(Credential),
    pointChange: createServerService<PointChange>(PointChange),
    company: createServerService<Company>(Company),
    department: createServerService<Department>(Department),
    travelPolicy: createServerService<TravelPolicy>(TravelPolicy),
    agency: createServerService<Agency>(Agency),
    agencyUser: createServerService<AgencyUser>(AgencyUser),
    tripPlan: createServerService<TripPlan>(TripPlan),
    tripDetail: createServerService<TripDetail>(TripDetail),
    tripPlanLog: createServerService<TripPlanLog>(TripPlanLog),
    moneyChange: createServerService<MoneyChange>(MoneyChange),
    project: createServerService<Project>(Project),
    account: createServerService<Account>(Account),
    seed: createServerService<Seed>(Seed),
    token: createServerService<Token>(Token),
});
