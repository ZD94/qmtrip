
import { initModels } from 'api/_types';

import { Staff, Credential, PointChange, InvitedLink, StaffSupplierInfo } from 'api/_types/staff';
import { Company, MoneyChange, Supplier } from 'api/_types/company';
import { Department } from 'api/_types/department';
import { TravelPolicy, SubsidyTemplate } from 'api/_types/travelPolicy';
import { AccordHotel } from 'api/_types/accordHotel';
import { Agency, AgencyUser } from 'api/_types/agency';
import {TripPlan, TripDetail, Project, TripPlanLog, TripApprove, FinanceCheckCode} from 'api/_types/tripPlan';
import {Account, Token, AccountOpenid} from 'api/_types/auth';
import { Seed } from 'api/_types/seed';
import { createServerService } from 'common/model/sequelize';
import {TravelBudgetLog} from "api/_types/travelbudget";
import {DDTalkCorp, DDTalkUser} from "api/_types/ddtalk";
import {CoinAccount, CoinAccountChange} from "./_types/coin";

initModels({
    staff: createServerService<Staff>(Staff),
    credential: createServerService<Credential>(Credential),
    pointChange: createServerService<PointChange>(PointChange),
    invitedLink: createServerService<InvitedLink>(InvitedLink),
    staffSupplierInfo: createServerService<StaffSupplierInfo>(StaffSupplierInfo),
    company: createServerService<Company>(Company),
    supplier: createServerService<Supplier>(Supplier),
    department: createServerService<Department>(Department),
    travelPolicy: createServerService<TravelPolicy>(TravelPolicy),
    subsidyTemplate: createServerService<SubsidyTemplate>(SubsidyTemplate),
    accordHotel: createServerService<AccordHotel>(AccordHotel),
    agency: createServerService<Agency>(Agency),
    agencyUser: createServerService<AgencyUser>(AgencyUser),
    tripPlan: createServerService<TripPlan>(TripPlan),
    tripDetail: createServerService<TripDetail>(TripDetail),
    tripPlanLog: createServerService<TripPlanLog>(TripPlanLog),
    moneyChange: createServerService<MoneyChange>(MoneyChange),
    project: createServerService<Project>(Project),
    tripApprove: createServerService<TripApprove>(TripApprove),
    account: createServerService<Account>(Account),
    seed: createServerService<Seed>(Seed),
    token: createServerService<Token>(Token),
    accountOpenid: createServerService<AccountOpenid>(AccountOpenid),
    travelBudgetLog: createServerService<TravelBudgetLog>(TravelBudgetLog),
    financeCheckCode: createServerService<FinanceCheckCode>(FinanceCheckCode),

    ddtalkCorp: createServerService<DDTalkCorp>(DDTalkCorp),
    ddtalkUser: createServerService<DDTalkUser>(DDTalkUser),
    
    coinAccount: createServerService<CoinAccount>(CoinAccount),
    coinAccountChange: createServerService<CoinAccountChange>(CoinAccountChange),
});
