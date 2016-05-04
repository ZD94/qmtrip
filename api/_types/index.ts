import { Company } from "./company";
import { Staff } from "./staff";
import { TravelPolicy } from './travelPolicy';
import { Department } from './department';
import { Agency, AgencyUser } from './agency';

interface ServiceInterface<T> {
    create(obj: Object): Promise<T>;
    get(id: string): Promise<T>;
    find(where: any): Promise<T[]>;
}

export interface ModelsInterface {
    staff: ServiceInterface<Staff>;
    company: ServiceInterface<Company>
    department: ServiceInterface<Department>;
    travelPolicy: ServiceInterface<TravelPolicy>;

    agency: ServiceInterface<Agency>
    agencyUser: ServiceInterface<AgencyUser>;
}

class ServiceDelegate<T> implements ServiceInterface<T>{
    constructor(public target: ServiceInterface<T>){
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
}

class ModelsDelegate implements ModelsInterface {
    constructor() {
    }

    staff: ServiceDelegate<Staff>;
    company: ServiceDelegate<Company>
    department: ServiceDelegate<Department>;
    travelPolicy: ServiceDelegate<TravelPolicy>;

    agency: ServiceDelegate<Agency>
    agencyUser: ServiceDelegate<AgencyUser>;

    init(target: ModelsInterface){
        this.staff = new ServiceDelegate<Staff>(target.staff);
        this.company = new ServiceDelegate<Company>(target.company);
        this.department = new ServiceDelegate<Department>(target.department);
        this.travelPolicy = new ServiceDelegate<TravelPolicy>(target.travelPolicy);
        this.agency = new ServiceDelegate<Agency>(target.agency);
        this.agencyUser = new ServiceDelegate<AgencyUser>(target.agencyUser);
    }
}
export var Models = new ModelsDelegate();

