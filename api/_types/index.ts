
import { Company, MoneyChange } from "./company";
import { Staff, Credential, PointChange } from "./staff";
import { TravelPolicy } from './travelPolicy';
import { Department } from './department';
import { Agency, AgencyUser } from './agency';
import {TripPlan, TripDetail, Project, TripPlanLog, ApproveOrder} from './tripPlan';
import {Account, Token, AccountOpenid} from './auth';
import {Seed} from "./seed";
import { ModelInterface } from 'common/model/interface';
import { ModelDelegate } from 'common/model/delegate';


export enum EGender {
    MALE = 1,
    FEMALE
};

export enum EAccountType {
    STAFF = 1,
    AGENCY = 2
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
    approveOrder: ModelInterface<ApproveOrder>;
    
    account: ModelInterface<Account>;
    token: ModelInterface<Token>;
    accountOpenid: ModelInterface<AccountOpenid>;
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
    approveOrder: new ModelDelegate<ApproveOrder>(),

    account: new ModelDelegate<Account>(),
    token: new ModelDelegate<Token>(),
    accountOpenid: new ModelDelegate<AccountOpenid>(),
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
