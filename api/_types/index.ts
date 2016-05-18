import { ServiceInterface, ServiceDelegate } from 'common/model';

import { Company, MoneyChange } from "./company";
import { Staff, Credential, PointChange } from "./staff";
import { TravelPolicy } from './travelPolicy';
import { Department } from './department';
import { Agency, AgencyUser } from './agency';
import {TripPlan, TripDetail, Project} from './tripPlan';
import { Account } from './auth';
import {Seed} from "./seed";

export interface ModelsInterface {
    staff: ServiceInterface<Staff>;
    credential: ServiceInterface<Credential>;
    pointChange: ServiceInterface<PointChange>;
    
    company: ServiceInterface<Company>;
    moneyChange: ServiceInterface<MoneyChange>;
    
    department: ServiceInterface<Department>;
    travelPolicy: ServiceInterface<TravelPolicy>;

    agency: ServiceInterface<Agency>;
    agencyUser: ServiceInterface<AgencyUser>;

    seed: ServiceInterface<Seed>;
    tripPlan: ServiceInterface<TripPlan>;
    tripDetail: ServiceInterface<TripDetail>;
    project: ServiceInterface<Project>;

    account: ServiceInterface<Account>;
}

export var Models: ModelsInterface = {
    staff: new ServiceDelegate<Staff>(),
    credential: new ServiceDelegate<Credential>(),
    pointChange: new ServiceDelegate<PointChange>(),
    
    company: new ServiceDelegate<Company>(),
    moneyChange: new ServiceDelegate<MoneyChange>(),
    
    department: new ServiceDelegate<Department>(),
    travelPolicy: new ServiceDelegate<TravelPolicy>(),

    agency: new ServiceDelegate<Agency>(),
    agencyUser: new ServiceDelegate<AgencyUser>(),

    seed: new ServiceDelegate<Seed>(),
    tripPlan: new ServiceDelegate<TripPlan>(),
    tripDetail: new ServiceDelegate<TripDetail>(),
    project: new ServiceDelegate<Project>(),

    account: new ServiceDelegate<Account>(),
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
export * from './auth';
export * from './seed';
