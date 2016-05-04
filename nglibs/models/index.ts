
import ng = require('angular');

import {IRegistry, Registry} from 'api/_types/index';
import {Staff} from 'api/_types/staff';
import {Company} from 'api/_types/company';
import { Department } from '../../api/_types/department';
import { TravelPolicy } from '../../api/_types/travelPolicy';
import { Agency, AgencyUser } from '../../api/_types/agency';

import * as ApiStaff from 'api/client/staff';
import * as ApiCompany from 'api/client/company';
import * as ApiDepartment from 'api/client/department';
import * as ApiTravelPolicy from 'api/client/travelPolicy';
import * as ApiAgency from 'api/client/agency';

const API = require('api');

export function ngService(name: string) {
    return function(constructor: Function) {
        angular.module('nglibs')
            .service(name, constructor);
    };
}

interface Resolvable {
    $resolve?: () => Promise<any>;
}

async function requireAPI<T>(name) {
    if(!API[name]){
        API.require(name)
        await API.onload();
    }
    return API[name] as T;
}

@ngService('Models')
class ClientRegistry implements IRegistry {
    $injector: ng.auto.IInjectorService;
    $cacheFactory: ng.ICacheFactoryService;
    constructor($injector, $cacheFactory) {
        this.$injector = $injector;
        this.$cacheFactory = $cacheFactory;
        Registry.setTarget(this);
    }

    getCache(name: string) {
        return this.$cacheFactory.get(name) || this.$cacheFactory(name);
    }

    private async cacheGet<T extends Resolvable>(id:string, cacheName:string,
                                            getter: (string)=>Promise<T>): Promise<T>{
        var self = this;
        var cache = self.getCache(cacheName);
        var entity = cache.get<T|Promise<T> >(id);
        if(entity)
            return entity;
        var pEntity = getter(id);
        cache.put(id, pEntity);
        entity = await pEntity;
        if(typeof entity.$resolve == 'function') {
            await entity.$resolve();
        }
        cache.put(id, entity);
        return entity;
    }
    
    async getStaff(id:string) : Promise<Staff> {
        return this.cacheGet<Staff>(id, 'staff', async (id:string)=>{
            var api = await requireAPI<typeof ApiStaff>('staff');
            return api.getStaff({id: id});
        });
    }

    async getCompany(id:string) : Promise<Company> {
        return this.cacheGet<Company>(id, 'company', async (id:string)=>{
            var api = await requireAPI<typeof ApiCompany>('company');
            return api.getCompanyById({companyId: id});
        });
    }

    async getDepartment(id: string): Promise<Department> {
        return this.cacheGet<Department>(id, 'department', async (id:string)=>{
            var api = await requireAPI<typeof ApiDepartment>('department');
            return api.getDepartment({id: id});
        });
    }

    async getTravelPolicy(id: string): Promise<TravelPolicy> {
        return this.cacheGet<TravelPolicy>(id, 'travelPolicy', async (id:string)=>{
            var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
            return api.getTravelPolicy({id: id});
        });
    }

    async getAgency(id: string): Promise<Agency> {
        return this.cacheGet<Agency>(id, 'agency', async (id:string)=>{
            var api = await requireAPI<typeof ApiAgency>('agency');
            return api.getAgencyById({agencyId: id});
        });
    }

    async getAgencyUser(id: string): Promise<AgencyUser> {
        return this.cacheGet<AgencyUser>(id, 'agencyUser', async (id:string)=>{
            var api = await requireAPI<typeof ApiAgency>('agency');
            return api.getAgencyUser({agencyUserId: id});
        });
    }
}

import './menu';
import './place';