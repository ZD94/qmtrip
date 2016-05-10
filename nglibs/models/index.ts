
import * as ApiStaff from 'api/client/staff';
import ApiCompany= require('api/client/company');
import * as ApiDepartment from 'api/client/department';
import * as ApiTravelPolicy from 'api/client/travelPolicy';
import ApiAgency = require('api/client/agency');

import ng = require('angular');

import {
    ServiceInterface, ModelsInterface, Models,
    Staff, Company, Department, TravelPolicy,
    Agency, AgencyUser
} from 'api/_types';

const API = require('common/api');

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
        return api.getStaff({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.getStaffs(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiStaff>('staff');
        fields['id'] = id;
        return api.updateStaff(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiStaff>('staff');
        return api.deleteStaff({id: id});
    }
}

class CompanyService extends ClientService<Company>{
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
        return api.getDepartment({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.getDepartments(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiDepartment>('department');
        fields[id] = id;
        return api.updateDepartment(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiDepartment>('department');
        return api.deleteDepartment({id: id});
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
        return api.getTravelPolicy({id: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.getTravelPolicies(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        fields[id] = id;
        return api.updateTravelPolicy(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiTravelPolicy>('travelPolicy');
        return api.deleteTravelPolicy({id: id});
    }
}

class AgencyService extends ClientService<Agency>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('agency'));
    }

    async $create(obj: {name: string, email: string, mobile: string, userName: string, description?: string,
        remark?: string, pwd?: string}): Promise<Agency>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.create(obj);
    }
    async $get(id: string): Promise<Agency>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.getAgencyById({agencyId: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.listAgency(where);
    }
    async $update(id: string, fields: Object): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        fields[''] = id;
        return api.updateAgency(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.deleteAgency({agencyId: id});
    }
}

class AgencyUserService extends ClientService<AgencyUser>{
    constructor($cacheFactory: ng.ICacheFactoryService){
        super($cacheFactory('agencyuser'));
    }

    async $create(obj: any): Promise<AgencyUser>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.createAgencyUser(obj);
    }
    async $get(id: string): Promise<AgencyUser>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.getAgencyUser({agencyUserId: id});
    }
    async $find(where: any): Promise<string[]>{
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.find(where);
    }
    async $update(id: string, fields: {id: string, status?: number, name?: string, sex?: string, email?: string,
        mobile?: string, avatar?: string, roleId?: string}): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        fields['id'] = id;
        return api.updateAgencyUser(fields);
    }
    async $destroy(id: string): Promise<any> {
        var api = await requireAPI<typeof ApiAgency>('agency');
        return api.deleteAgencyUser({userId: id});
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