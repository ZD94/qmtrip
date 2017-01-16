
import { initModels } from 'api/_types';

import { Staff, Credential, PointChange, InvitedLink, StaffSupplierInfo } from 'api/_types/staff';
import { Company, MoneyChange, Supplier } from 'api/_types/company';
import { Department, StaffDepartment } from 'api/_types/department';
import { PromoCode } from 'api/_types/promoCode';
import { TravelPolicy, SubsidyTemplate } from 'api/_types/travelPolicy';
import { AccordHotel } from 'api/_types/accordHotel';
import { Notice, NoticeAccount } from 'api/_types/notice';
import { Agency, AgencyUser } from 'api/_types/agency';
import {
    TripPlan, TripDetail, Project, TripPlanLog, TripApprove, FinanceCheckCode,
    TripDetailInvoice, TripDetailTraffic, TripDetailHotel
} from 'api/_types/tripPlan';
import {Account, Token} from 'api/_types/auth';
import { Seed } from 'api/_types/seed';
import { createServerService } from 'common/model/sequelize';
import {TravelBudgetLog} from "api/_types/travelbudget";
import {DDTalkCorp, DDTalkUser} from "api/_types/ddtalk";
import {CoinAccount, CoinAccountChange} from "./_types/coin";
import {TripDetailSubsidy, TripDetailSpecial} from "./_types/tripPlan/tripDetailInfo";
import {Approve} from "./_types/approve/index";

initModels({
    staff: createServerService<Staff>(Staff),
    credential: createServerService<Credential>(Credential),
    pointChange: createServerService<PointChange>(PointChange),
    invitedLink: createServerService<InvitedLink>(InvitedLink),
    staffSupplierInfo: createServerService<StaffSupplierInfo>(StaffSupplierInfo),
    company: createServerService<Company>(Company),
    supplier: createServerService<Supplier>(Supplier),
    promoCode: createServerService<PromoCode>(PromoCode),
    department: createServerService<Department>(Department),
    staffDepartment: createServerService<StaffDepartment>(StaffDepartment),
    travelPolicy: createServerService<TravelPolicy>(TravelPolicy),
    subsidyTemplate: createServerService<SubsidyTemplate>(SubsidyTemplate),
    accordHotel: createServerService<AccordHotel>(AccordHotel),
    notice: createServerService<Notice>(Notice),
    noticeAccount: createServerService<NoticeAccount>(NoticeAccount),
    agency: createServerService<Agency>(Agency),
    agencyUser: createServerService<AgencyUser>(AgencyUser),
    tripPlan: createServerService<TripPlan>(TripPlan),
    tripDetail: createServerService<TripDetail>(TripDetail),
    tripDetailInvoice: createServerService<TripDetailInvoice>(TripDetailInvoice),
    tripDetailTraffic: createServerService<TripDetailTraffic>(TripDetailTraffic),
    tripDetailHotel: createServerService<TripDetailHotel>(TripDetailHotel),
    tripDetailSubsidy: createServerService<TripDetailSubsidy>(TripDetailSubsidy),
    tripDetailSpecial: createServerService<TripDetailSpecial>(TripDetailSpecial),

    tripPlanLog: createServerService<TripPlanLog>(TripPlanLog),
    moneyChange: createServerService<MoneyChange>(MoneyChange),
    project: createServerService<Project>(Project),
    tripApprove: createServerService<TripApprove>(TripApprove),
    approve: createServerService<Approve>(Approve),
    account: createServerService<Account>(Account),
    seed: createServerService<Seed>(Seed),
    token: createServerService<Token>(Token),
    travelBudgetLog: createServerService<TravelBudgetLog>(TravelBudgetLog),
    financeCheckCode: createServerService<FinanceCheckCode>(FinanceCheckCode),

    ddtalkCorp: createServerService<DDTalkCorp>(DDTalkCorp),
    ddtalkUser: createServerService<DDTalkUser>(DDTalkUser),
    
    coinAccount: createServerService<CoinAccount>(CoinAccount),
    coinAccountChange: createServerService<CoinAccountChange>(CoinAccountChange),
});
