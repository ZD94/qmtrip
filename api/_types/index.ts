import {Company, MoneyChange} from "./company";
import { Staff, Credential } from "./staff";
import { TravelPolicy } from './travelPolicy';
import { Department } from './department';
import { Agency, AgencyUser } from './agency';
import { TripPlan, TripDetail } from './tripPlan';

var API = require('common/api');

export async function requireAPI<T>(name) {
    if(!API[name]){
        API.require(name)
        await API.onload();
    }
    return API[name] as T;
}

export interface ModelObject {
    save(): Promise<void>;
    destroy(): Promise<any>;
}

export interface ServiceInterface<T> {
    create(obj: Object): Promise<T>;
    get(id: string): Promise<T>;
    find(where: any): Promise<T[]>;
    update(id:string, fields: Object): Promise<any>;
    destroy(id:string): Promise<any>;
}

interface Resolvable {
    id: string;
    $resolve?: () => Promise<any>;
}

interface CacheInterface {
    put<T>(key: string, value?: T): T;
    get<T>(key: string): T;
    remove(key: string): void;
    removeAll(): void;
    destroy(): void;
}

import {autobind} from 'core-decorators';

async function resolveResolvable(obj: Resolvable) {
    if(typeof obj.$resolve == 'function') {
        await obj.$resolve();
    }
}

@autobind
export abstract class CachedService<T extends Resolvable> implements ServiceInterface<T>{
    abstract $create(obj: Object): Promise<T>;
    abstract $get(id: string): Promise<T>;
    abstract $find(where: any): Promise<string[]|T[]>;
    abstract $update(id:string, fields: Object): Promise<any>;
    abstract $destroy(id:string): Promise<any>;

    constructor(private $cache: CacheInterface){}
    async create(o: Object): Promise<T>{
        var obj = await this.$create(o);
        this.$cache.put(obj.id, obj);
        return obj;
    }
    private findId2Obj(list: string[]): Promise<T[]>{
        return Promise.all(list.map((id)=>this.get(id)));
    }
    private findObj2Cache(list: T[]): Promise<T[]>{
        var self = this;
        var newlist = list.map(async function(item){
            var id = item.id;
            var cached = self.$cache.get<T>(id);
            if(cached)
                return cached;
            var objPromise = resolveResolvable(item);
            self.$cache.put(id, objPromise);
            await objPromise;
            self.$cache.put(id, item);
            return item;
        });
        return Promise.all(newlist);
    }
    async find(where: any): Promise<T[]>{
        var self = this;
        var list = await this.$find(where);
        if(list.length == 0)
            return [];
        if(typeof list[0] == 'string')
            return this.findId2Obj(list as string[]);
        return this.findObj2Cache(list as T[]);
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
            await resolveResolvable(obj);
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

@autobind
class ServiceDelegate<T> implements ServiceInterface<T>{
    private target: ServiceInterface<T>;
    constructor(){
    }
    create(obj: Object): Promise<T>{
        return this.target.create(obj);
    }
    get(id: string): Promise<T>{
        return this.target.get(id);
    }
    find(where: any): Promise<T[]>{
        return this.target.find(where);
    }
    update(id:string, fields: Object): Promise<any> {
        return this.target.update(id, fields);
    }
    destroy(id:string): Promise<any> {
        return this.target.destroy(id);
    }
    setTarget(target: ServiceInterface<T>) {
        this.target = target;
    }
}

export interface ModelsInterface {
    staff: ServiceInterface<Staff>;
    credential: ServiceInterface<Credential>;
    company: ServiceInterface<Company>;
    department: ServiceInterface<Department>;
    travelPolicy: ServiceInterface<TravelPolicy>;

    agency: ServiceInterface<Agency>;
    agencyUser: ServiceInterface<AgencyUser>;

    tripPlan: ServiceInterface<TripPlan>;
    
    tripDetail: ServiceInterface<TripDetail>;
    
    moneyChange: ServiceInterface<MoneyChange>;
}

export var Models: ModelsInterface = {
    staff: new ServiceDelegate<Staff>(),
    credential: new ServiceDelegate<Credential>(),
    company: new ServiceDelegate<Company>(),
    department: new ServiceDelegate<Department>(),
    travelPolicy: new ServiceDelegate<TravelPolicy>(),

    agency: new ServiceDelegate<Agency>(),
    agencyUser: new ServiceDelegate<AgencyUser>(),

    tripPlan: new ServiceDelegate<TripPlan>(),
    tripDetail: new ServiceDelegate<TripDetail>(),
    moneyChange: new ServiceDelegate<MoneyChange>(),
};

export function initModels(models: ModelsInterface){
    for(let k in models){
        if(Models[k])
            Models[k].setTarget(models[k]);
    }
}

export * from "./company";
export * from "./staff";
export * from './travelPolicy';
export * from './department';
export * from './agency';
export * from './tripPlan';