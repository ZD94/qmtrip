///<reference path="agency/agency-operate-log.ts"/>

import { Company, MoneyChange, Supplier, TripPlanNumChange } from "./company";
import { Staff, Credential, PointChange, InvitedLink, StaffSupplierInfo } from "./staff";
import { TravelPolicy, SubsidyTemplate } from './travelPolicy';
import { PromoCode } from './promoCode';
import { Department, StaffDepartment } from './department';
import { AccordHotel } from './accordHotel';
import { Notice, NoticeAccount } from './notice';
import { Agency, AgencyUser } from './agency';
import {
    TripPlan, TripDetail, Project, TripPlanLog, TripApprove, FinanceCheckCode, TripDetailInvoice,
    TripDetailHotel, TripDetailTraffic
} from './tripPlan';
import {Account, Token} from './auth';
import {Seed} from "./seed";
import { ModelInterface } from 'common/model/interface';
import { ModelDelegate } from 'common/model/delegate';
import {TravelBudgetLog} from "./travelbudget";
import {DDTalkCorp, DDTalkUser} from "./ddtalk";
import {CoinAccountChange, CoinAccount} from "./coin";
import {TripDetailSubsidy, TripDetailSpecial} from "./tripPlan/tripDetailInfo";
import {Approve} from "./approve/index";
import {AgencyOperateLog} from "./agency/agency-operate-log";


export enum EGender {
    MALE = 1,
    FEMALE = 2
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
    staffSupplierInfo: ModelInterface<StaffSupplierInfo>;

    company: ModelInterface<Company>;
    moneyChange: ModelInterface<MoneyChange>;
    supplier: ModelInterface<Supplier>;
    tripPlanNumChange: ModelInterface<TripPlanNumChange>;

    promoCode: ModelInterface<PromoCode>;
    department: ModelInterface<Department>;
    staffDepartment: ModelInterface<StaffDepartment>;
    travelPolicy: ModelInterface<TravelPolicy>;
    subsidyTemplate: ModelInterface<SubsidyTemplate>;
    accordHotel: ModelInterface<AccordHotel>;
    notice: ModelInterface<Notice>;
    noticeAccount: ModelInterface<NoticeAccount>;

    agency: ModelInterface<Agency>;
    agencyUser: ModelInterface<AgencyUser>;
    agencyOperateLog: ModelInterface<AgencyOperateLog>;



    seed: ModelInterface<Seed>;
    tripPlan: ModelInterface<TripPlan>;
    tripDetail: ModelInterface<TripDetail>;
    tripDetailInvoice: ModelInterface<TripDetailInvoice>;
    tripDetailTraffic: ModelInterface<TripDetailTraffic>;
    tripDetailHotel: ModelInterface<TripDetailHotel>;
    tripDetailSubsidy: ModelInterface<TripDetailSubsidy>;
    tripDetailSpecial: ModelInterface<TripDetailSpecial>;

    tripPlanLog: ModelInterface<TripPlanLog>;
    project: ModelInterface<Project>;
    tripApprove: ModelInterface<TripApprove>;
    approve: ModelInterface<Approve>;
    travelBudgetLog: ModelInterface<TravelBudgetLog>;
    financeCheckCode: ModelInterface<FinanceCheckCode>;

    account: ModelInterface<Account>;
    token: ModelInterface<Token>;

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
    staffSupplierInfo: new ModelDelegate<StaffSupplierInfo>(),

    company: new ModelDelegate<Company>(),
    moneyChange: new ModelDelegate<MoneyChange>(),
    supplier: new ModelDelegate<Supplier>(),
    tripPlanNumChange: new ModelDelegate<TripPlanNumChange>(),

    promoCode: new ModelDelegate<PromoCode>(),
    department: new ModelDelegate<Department>(),
    staffDepartment: new ModelDelegate<StaffDepartment>(),
    travelPolicy: new ModelDelegate<TravelPolicy>(),
    subsidyTemplate: new ModelDelegate<SubsidyTemplate>(),
    accordHotel: new ModelDelegate<AccordHotel>(),
    notice: new ModelDelegate<Notice>(),
    noticeAccount: new ModelDelegate<NoticeAccount>(),

    agency: new ModelDelegate<Agency>(),
    agencyUser: new ModelDelegate<AgencyUser>(),
    agencyOperateLog: new ModelDelegate<AgencyOperateLog>(),

    seed: new ModelDelegate<Seed>(),
    tripPlan: new ModelDelegate<TripPlan>(),
    tripDetail: new ModelDelegate<TripDetail>(),
    tripDetailInvoice: new ModelDelegate<TripDetailInvoice>(),
    tripDetailTraffic: new ModelDelegate<TripDetailTraffic>(),
    tripDetailHotel: new ModelDelegate<TripDetailHotel>(),
    tripDetailSubsidy: new ModelDelegate<TripDetailSubsidy>(),
    tripDetailSpecial: new ModelDelegate<TripDetailSpecial>(),
    
    tripPlanLog: new ModelDelegate<TripPlanLog>(),
    project: new ModelDelegate<Project>(),
    tripApprove: new ModelDelegate<TripApprove>(),
    approve: new ModelDelegate<Approve>(),
    travelBudgetLog: new ModelDelegate<TravelBudgetLog>(),
    account: new ModelDelegate<Account>(),
    token: new ModelDelegate<Token>(),
    financeCheckCode: new ModelDelegate<FinanceCheckCode>(),

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
export * from './promoCode';
export * from './accordHotel';
export * from './agency';
export * from './tripPlan';
export * from './auth';
export * from './seed';
export * from './notice';
