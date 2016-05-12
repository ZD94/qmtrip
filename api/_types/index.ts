import { Company } from "./company";
import { Staff, Credential } from "./staff";
import { TravelPolicy } from './travelPolicy';
import { Department } from './department';
import { Agency, AgencyUser } from './agency';

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

export interface ModelsInterface {
    staff: ServiceInterface<Staff>;
    credential: ServiceInterface<Credential>;
    company: ServiceInterface<Company>;
    department: ServiceInterface<Department>;
    travelPolicy: ServiceInterface<TravelPolicy>;

    agency: ServiceInterface<Agency>
    agencyUser: ServiceInterface<AgencyUser>;
}

import {autobind} from 'core-decorators';

class ServiceDelegate<T> implements ServiceInterface<T>{
    target: ServiceInterface<T>;
    constructor(){
    }
    @autobind
    create(obj: Object): Promise<T>{
        return this.target.create(obj);
    }
    @autobind
    get(id: string): Promise<T>{
        return this.target.get(id);
    }
    @autobind
    find(where: any): Promise<T[]>{
        return this.target.find(where);
    }
    @autobind
    update(id:string, fields: Object): Promise<any> {
        return this.target.update(id, fields);
    }
    @autobind
    destroy(id:string): Promise<any> {
        return this.target.destroy(id);
    }
    setTarget(target: ServiceInterface<T>) {
        this.target = target;
    }
}

class ModelsDelegate implements ModelsInterface {
    constructor() {
    }

    staff: ServiceDelegate<Staff> = new ServiceDelegate<Staff>();
    credential: ServiceDelegate<Credential> = new ServiceDelegate<Credential>();
    company: ServiceDelegate<Company> = new ServiceDelegate<Company>();
    department: ServiceDelegate<Department> = new ServiceDelegate<Department>();
    travelPolicy: ServiceDelegate<TravelPolicy> = new ServiceDelegate<TravelPolicy>();

    agency: ServiceDelegate<Agency> = new ServiceDelegate<Agency>();
    agencyUser: ServiceDelegate<AgencyUser> = new ServiceDelegate<AgencyUser>();

    init(target: ModelsInterface){
        this.staff.setTarget(target.staff);
        this.credential.setTarget(target.credential);
        this.company.setTarget(target.company);
        this.department.setTarget(target.department);
        this.travelPolicy.setTarget(target.travelPolicy);
        this.agency.setTarget(target.agency);
        this.agencyUser.setTarget(target.agencyUser);
    }
}
export var Models = new ModelsDelegate();

export * from "./company";
export * from "./staff";
export * from './travelPolicy';
export * from './department';
export * from './agency';
