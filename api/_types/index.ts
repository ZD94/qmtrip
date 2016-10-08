
import { Company, MoneyChange } from "./company";
import { Staff, Credential, PointChange, InvitedLink } from "./staff";
import { TravelPolicy, SubsidyTemplate } from './travelPolicy';
import { Department } from './department';
import { AccordHotel } from './accordHotel';
import { Agency, AgencyUser } from './agency';
import {TripPlan, TripDetail, Project, TripPlanLog, TripApprove} from './tripPlan';
import {Account, Token, AccountOpenid} from './auth';
import {Seed} from "./seed";
import { ModelInterface } from 'common/model/interface';
import { ModelDelegate } from 'common/model/delegate';
import {TravelBudgetLog} from "./travelbudget";
import {DDTalkCorp, DDTalkUser} from "./ddtalk";
import {CoinAccountChange, CoinAccount} from "./coin";


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
    invitedLink: ModelInterface<InvitedLink>;

    company: ModelInterface<Company>;
    moneyChange: ModelInterface<MoneyChange>;
    
    department: ModelInterface<Department>;
    travelPolicy: ModelInterface<TravelPolicy>;
    subsidyTemplate: ModelInterface<SubsidyTemplate>;
    accordHotel: ModelInterface<AccordHotel>;

    agency: ModelInterface<Agency>;
    agencyUser: ModelInterface<AgencyUser>;

    seed: ModelInterface<Seed>;
    tripPlan: ModelInterface<TripPlan>;
    tripDetail: ModelInterface<TripDetail>;
    tripPlanLog: ModelInterface<TripPlanLog>;
    project: ModelInterface<Project>;
    tripApprove: ModelInterface<TripApprove>;
    travelBudgetLog: ModelInterface<TravelBudgetLog>;

    account: ModelInterface<Account>;
    token: ModelInterface<Token>;
    accountOpenid: ModelInterface<AccountOpenid>;

    ddtalkCorp: ModelInterface<DDTalkCorp>;
    ddtalkUser: ModelInterface<DDTalkUser>;

    coinAccount: ModelInterface<CoinAccount>;
    coinAccountChange: ModelInterface<CoinAccountChange>;
}

export var Models: ModelsInterface = {
    staff: new ModelDelegate<Staff>(),
    credential: new ModelDelegate<Credential>(),
    pointChange: new ModelDelegate<PointChange>(),
    invitedLink: new ModelDelegate<InvitedLink>(),

    company: new ModelDelegate<Company>(),
    moneyChange: new ModelDelegate<MoneyChange>(),
    
    department: new ModelDelegate<Department>(),
    travelPolicy: new ModelDelegate<TravelPolicy>(),
    subsidyTemplate: new ModelDelegate<SubsidyTemplate>(),
    accordHotel: new ModelDelegate<AccordHotel>(),

    agency: new ModelDelegate<Agency>(),
    agencyUser: new ModelDelegate<AgencyUser>(),

    seed: new ModelDelegate<Seed>(),
    tripPlan: new ModelDelegate<TripPlan>(),
    tripDetail: new ModelDelegate<TripDetail>(),
    tripPlanLog: new ModelDelegate<TripPlanLog>(),
    project: new ModelDelegate<Project>(),
    tripApprove: new ModelDelegate<TripApprove>(),
    travelBudgetLog: new ModelDelegate<TravelBudgetLog>(),
    account: new ModelDelegate<Account>(),
    token: new ModelDelegate<Token>(),
    accountOpenid: new ModelDelegate<AccountOpenid>(),

    ddtalkCorp: new ModelDelegate<DDTalkCorp>(),
    ddtalkUser: new ModelDelegate<DDTalkUser>(),

    coinAccount: new ModelDelegate<CoinAccount>(),
    coinAccountChange: new ModelDelegate<CoinAccountChange>(),
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
export * from './accordHotel';
export * from './agency';
export * from './tripPlan';
export * from './auth';
export * from './seed';
