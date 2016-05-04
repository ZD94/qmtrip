import { Company } from "./company";
import { Staff } from "./staff";
import { TravelPolicy } from './travelPolicy';
import { Department } from './department';
import { Agency, AgencyUser } from './agency';

export interface IRegistry {
    getStaff(id: string): Promise<Staff>;
    getCompany(id: string): Promise<Company>;
    getDepartment(id: string): Promise<Department>;
    getTravelPolicy(id: string): Promise<TravelPolicy>;

    getAgency(id: string): Promise<Agency>;
    getAgencyUser(id: string): Promise<AgencyUser>;
}

class RegistryDelegate implements IRegistry {
    constructor() {
    }

    private target: IRegistry;
    setTarget(target: IRegistry) {
        this.target = target;
    }

    getStaff(id: string): Promise<Staff> {
        return this.target.getStaff(id);
    }

    getCompany(id: string): Promise<Company> {
        return this.target.getCompany(id);
    }

    getDepartment(id: string): Promise<Department> {
        return this.target.getDepartment(id);
    }

    getTravelPolicy(id: string): Promise<TravelPolicy> {
        return this.target.getTravelPolicy(id);
    }

    getAgency(id: string): Promise<Agency> {
        return this.target.getAgency(id);
    }

    getAgencyUser(id: string): Promise<AgencyUser> {
        return this.target.getAgencyUser(id);
    }
}
export var Registry = new RegistryDelegate();

