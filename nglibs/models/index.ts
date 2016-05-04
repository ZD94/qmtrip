
import ng = require('angular');

import { ServiceInterface, ModelsInterface, Models } from 'api/_types/index';
import {Staff} from 'api/_types/staff';
import {Company} from 'api/_types/company';
import { Department } from 'api/_types/department';
import { TravelPolicy } from 'api/_types/travelPolicy';
import { Agency, AgencyUser } from 'api/_types/agency';

import * as ApiStaff from 'api/client/staff';
import * as ApiCompany from 'api/client/company';
import * as ApiDepartment from 'api/client/department';
import * as ApiTravelPolicy from 'api/client/travelPolicy';
import * as ApiAgency from 'api/client/agency';

const API = require('api');

async function requireAPI<T>(name) {
    if(!API[name]){
        API.require(name)
        await API.onload();
    }
    return API[name] as T;
}

export function ngService(name: string) {
    return function(constructor: Function) {
        angular.module('nglibs')
            .service(name, constructor);
    };
}

interface Resolvable {
    id: string;
    $resolve?: () => Promise<any>;
}

abstract class ClientService<T extends Resolvable> implements ServiceInterface<T>{
    abstract $create(obj: Object): Promise<T>;
    abstract $get(id: string): Promise<T>;
    abstract $find(where: any): Promise<string[]>;
    abstract $update(id:string, fields: Object): Promise<any>;
    abstract $destroy(id:string): Promise<any>;
    
    constructor(private $cache: ng.ICacheObject){}
    async create(o: Object): Promise<T>{
        var obj = await this.$create(o);
        this.$cache.put(obj.id, obj);
        return obj;
    }
    async find(where: any): Promise<T[]>{
        var ids = await this.$find(where);
        return await Promise.all(ids.map((id)=>this.get(id)));
    }
    async get(id: string): Promise<T>{
        var self = this;
        var obj = self.$cache.get<T>(id);
        if(obj)
            return obj;
        var objPromise = getResolved(id);
        self.$cache.put(id, objPromise);
        obj = await objPromise;
        self.$cache.put(id, obj);
        return obj;

        async function getResolved(id: string): Promise<T>{
            var obj = await self.$get(id);
            if(typeof obj.$resolve == 'function') {
                await obj.$resolve();
            }
            return obj;
        }
    }
    async update(id: string, fields: Object): Promise<any> {
        var obj = this.$cache.get<T>(id);
        await this.$update(id, fields);
        _.extend(obj['target'], fields);
    }

    async destroy(id: string): Promise<any> {
        await this.$destroy(id);
        this.$cache.remove(id);
    }
}

class StaffService extends ClientService<Staff>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('staff'));
    }

    async $create(obj: Object): Promise<Staff>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.createStaff(obj);
    }
    async $get(id: string): Promise<Staff>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.getStaff(id);
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.find(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.update(id, fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.delete(id);
    }
}

class CompanyService extends ClientService<Company>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('company'));
    }

    async $create(obj: Object): Promise<Company>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.createCompany(obj);
    }
    async $get(id: string): Promise<Company>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.getCompany(id);
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.find(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.update(id, fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiCompany>('company');
        return api.delete(id);
    }
}

class DepartmentService extends ClientService<Department>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('department'));
    }

    async $create(obj: Object): Promise<Department>{
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.createDepartment(obj);
    }
    async $get(id: string): Promise<Department>{
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.getDepartment(id);
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.find(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.update(id, fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.delete(id);
    }
}

class TravelPolicyService extends ClientService<TravelPolicy>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('travelPolicy'));
    }

    async $create(obj: Object): Promise<TravelPolicy>{
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.createTravelPolicy(obj);
    }
    async $get(id: string): Promise<TravelPolicy>{
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.getTravelPolicy(id);
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.find(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.update(id, fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.delete(id);
    }
}

class AgencyService extends ClientService<Agency>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('agency'));
    }

    async $create(obj: Object): Promise<Agency>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.createAgency(obj);
    }
    async $get(id: string): Promise<Agency>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.getAgency(id);
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.find(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.update(id, fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.delete(id);
    }
}

class AgencyUserService extends ClientService<AgencyUser>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('staff'));
    }

    async $create(obj: Object): Promise<AgencyUser>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.createAgencyUser(obj);
    }
    async $get(id: string): Promise<AgencyUser>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.getAgencyUser(id);
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.findAgencyUser(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.updateAgencyUser(id, fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.deleteAgencyUser(id);
    }
}

@ngService('Models')
class ClientModels implements ModelsInterface {
    $injector: ng.auto.IInjectorService;
    $cacheFactory: ng.ICacheFactoryService;

    staff: ClientService<Staff>;
    company: ClientService<Company>;
    department: ClientService<Department>;
    travelPolicy: ClientService<TravelPolicy>;
    agency: ClientService<Agency>;
    agencyUser: ClientService<AgencyUser>;

    constructor($injector, $cacheFactory) {
        this.$injector = $injector;
        this.$cacheFactory = $cacheFactory;

        this.staff = new StaffService($cacheFactory);
        this.company = new CompanyService($cacheFactory);
        this.department = new DepartmentService($cacheFactory);
        this.travelPolicy = new TravelPolicyService($cacheFactory);
        this.agency = new AgencyService($cacheFactory);
        this.agencyUser = new AgencyUserService($cacheFactory);

        Models.init(this);
    }
}

import './menu';
import './place';