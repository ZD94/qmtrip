
import _ = require('lodash');

import { initModels } from 'api/_types';

import { Staff, Credential, PointChange, InvitedLink } from 'api/_types/staff';
import { Company, MoneyChange } from './_types/company';
import { Department } from './_types/department';
import { TravelPolicy } from './_types/travelPolicy';
import { AccordHotel } from './_types/accordHotel';
import { Agency, AgencyUser } from './_types/agency';
import {TripPlan, TripDetail, Project, TripPlanLog, TripApprove} from './_types/tripPlan';
import {Account, Token, AccountOpenid} from './_types/auth';
import { Seed } from './_types/seed';
import { createServerService } from 'common/model/sequelize';
import {TravelBudgetLog} from "./_types/travelbudget";

initModels({
    staff: createServerService<Staff>(Staff),
    credential: createServerService<Credential>(Credential),
    pointChange: createServerService<PointChange>(PointChange),
    invitedLink: createServerService<InvitedLink>(InvitedLink),
    company: createServerService<Company>(Company),
    department: createServerService<Department>(Department),
    travelPolicy: createServerService<TravelPolicy>(TravelPolicy),
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
});
