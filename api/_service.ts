
import _ = require('lodash');

import { initModels } from 'api/_types';

import StaffModule = require('api/staff');
import DepartmentModule = require ('api/department');
import TravelPolicyModule = require('api/travelPolicy');
import { ServiceInterface, ServiceAbstract } from '../common/model.client';
import { Staff, Credential, PointChange } from 'api/_types/staff';
import { Company, MoneyChange } from './_types/company';
import { Department } from './_types/department';
import { TravelPolicy } from './_types/travelPolicy';
import { Agency, AgencyUser } from './_types/agency';
import { TripPlan, TripDetail, Project } from './_types/tripPlan';
import { Account,Token } from './_types/auth';
import { Seed } from './_types/seed';

interface ServiceObject{
    target?: any;
    $fields?: any;
    $resolved?: any;
}

class SequelizeService<T extends ServiceObject> extends ServiceAbstract<T>{
    constructor(TClass:any){
        super(TClass);
    }

    create(obj: Object): T {
        var ret = super.create(obj);
        ret.target = this.TClass.$sqlmodel.build({});
        return ret;
    }
    async get(id: string): Promise<T>{
        var target = await this.TClass.$sqlmodel.findById(id);
        return new this.TClass(target);
    }
    async find(where: any): Promise<T[]>{
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

    async update(obj: T): Promise<T> {
        var fields = obj.$fields;
        obj.$fields = {};
        if(!fields)
            return obj;
        try {
            await obj.target.update(fields);
            return obj;
        } catch(e) {
            //出错后,需要将之前设置的fields恢复成之前的样子
            var previous = obj.target.previous();
            for(let k in previous) {
                obj.target.set(k, previous[k]);
            }
            //updater调用过程中可能有新更改,需要合并
            _.defaults(obj.$fields, fields);
            //删除$fields中和target中一样的
            Object.keys(obj.$fields)
                .forEach((k)=> {
                    if(obj.target[k] === obj.$fields[k])
                        delete obj.$fields[k];
                });
            throw e;
        }
    }
    $destroy(obj: T): Promise<any> {
        return obj.target.destroy();
    }
}
function createServerService<T>(TClass: any){
    return new SequelizeService<T>(TClass);
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
    moneyChange: createServerService<MoneyChange>(MoneyChange),
    project: createServerService<Project>(Project),
    account: createServerService<Account>(Account),
    seed: createServerService<Seed>(Seed),
    token: createServerService<Token>(Token),
});
