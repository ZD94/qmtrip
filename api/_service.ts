
import _ = require('lodash');

import { initModels } from 'api/_types';

import StaffModule = require('api/staff');
import DepartmentModule = require ('api/department');
import TravelPolicyModule = require('api/travelPolicy');
import { ModelInterface, ModelAbstract } from 'common/model';
import { Staff, Credential, PointChange } from 'api/_types/staff';
import { Company, MoneyChange } from './_types/company';
import { Department } from './_types/department';
import { TravelPolicy } from './_types/travelPolicy';
import { Agency, AgencyUser } from './_types/agency';
import {TripPlan, TripDetail, Project, TripPlanLog} from './_types/tripPlan';
import { Account,Token } from './_types/auth';
import { Seed } from './_types/seed';
import { ModelCached, CacheInterface, ModelObjInterface } from 'common/model/service';
import { createCache } from './_cache';
import sequelize = require('sequelize');

class ModelSequelize<T extends ModelObjInterface> extends ModelCached<T>{
    constructor(cache: CacheInterface, TClass:any){
        super(cache, TClass);
    }

    $create(obj: T): T {
        obj.target = this.$class.$sqlmodel.build(obj['$fields']);
        obj['$fields'] = {'!':'!'};
        return obj;
    }
    async $get(id: string, options?: Object): Promise<T>{
        var target = await this.$class.$sqlmodel.findById(id, options);
        if(!target)
            return undefined;
        return new this.$class(target);
    }
    async $find(where: any): Promise<T[]>{
        var {rows, count} = await this.$class.$sqlmodel.findAndCount(where);
        var objs = rows.map((row)=>new this.$class(row));
        return objs;
    }
    async $update(obj: T, fields: Object): Promise<Object>{
        try{
            obj.target.set(fields);
            await obj.target.save({returning:true});
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
    $destroy(obj: T, options?: Object): Promise<any> {
        return obj.target.destroy(options);
    }
}
function createServerService<T extends ModelObjInterface>(TClass: any){
    var cache = createCache(TClass.name);
    return new ModelSequelize<T>(cache, TClass);
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
