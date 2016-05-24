import { ModelInterface, ModelDelegate } from 'common/model';

import { Company, MoneyChange } from "./company";
import { Staff, Credential, PointChange } from "./staff";
import { TravelPolicy } from './travelPolicy';
import { Department } from './department';
import { Agency, AgencyUser } from './agency';
import {TripPlan, TripDetail, Project, TripPlanLog} from './tripPlan';
import { Account, Token } from './auth';
import {Seed} from "./seed";


export enum EGender {
    MALE = 1,
    FEMALE
};

export enum EAccountType {
    STAFF = 1,
    AGENCY
};

export interface ModelsInterface {
    staff: ModelInterface<Staff>;
    credential: ModelInterface<Credential>;
    pointChange: ModelInterface<PointChange>;
    
    company: ModelInterface<Company>;
    moneyChange: ModelInterface<MoneyChange>;
    
    department: ModelInterface<Department>;
    travelPolicy: ModelInterface<TravelPolicy>;

    agency: ModelInterface<Agency>;
    agencyUser: ModelInterface<AgencyUser>;

    seed: ModelInterface<Seed>;
    tripPlan: ModelInterface<TripPlan>;
    tripDetail: ModelInterface<TripDetail>;
    tripPlanLog: ModelInterface<TripPlanLog>;
    project: ModelInterface<Project>;

    account: ModelInterface<Account>;
    token: ModelInterface<Token>;
}

export var Models: ModelsInterface = {
    staff: new ModelDelegate<Staff>(),
    credential: new ModelDelegate<Credential>(),
    pointChange: new ModelDelegate<PointChange>(),
    
    company: new ModelDelegate<Company>(),
    moneyChange: new ModelDelegate<MoneyChange>(),
    
    department: new ModelDelegate<Department>(),
    travelPolicy: new ModelDelegate<TravelPolicy>(),

    agency: new ModelDelegate<Agency>(),
    agencyUser: new ModelDelegate<AgencyUser>(),

    seed: new ModelDelegate<Seed>(),
    tripPlan: new ModelDelegate<TripPlan>(),
    tripDetail: new ModelDelegate<TripDetail>(),
    tripPlanLog: new ModelDelegate<TripPlanLog>(),
    project: new ModelDelegate<Project>(),

    account: new ModelDelegate<Account>(),
    token: new ModelDelegate<Token>(),
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
