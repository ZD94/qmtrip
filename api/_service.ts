
import { initModels } from '_types';

import { Staff, Credential, PointChange, InvitedLink, StaffSupplierInfo } from '_types/staff';
import { Company, MoneyChange, Supplier, TripPlanNumChange } from '_types/company';
import { Department, StaffDepartment } from '_types/department';
import { PromoCode } from '_types/promoCode';
import { TravelPolicy, SubsidyTemplate,TravelPolicyRegion } from '_types/travelPolicy';
import { AccordHotel } from '_types/accordHotel';
import { Notice, NoticeAccount } from '_types/notice';
import { Agency, AgencyUser } from '_types/agency';
import {
    TripPlan, TripDetail, TripDetailStaff, Project, TripPlanLog, TripApprove, FinanceCheckCode,
    TripDetailInvoice, TripDetailTraffic, TripDetailHotel, Offline
} from '_types/tripPlan';
import {Account, Token} from '_types/auth';
import { Seed } from '_types/seed';
import { createServerService } from 'common/model/sequelize';
import {TravelBudgetLog} from "_types/travelbudget";
import {DDTalkCorp, DDTalkUser, DDTalkDepartment} from "_types/ddtalk";
import {CoinAccount, CoinAccountChange} from "_types/coin";
import {TripDetailSubsidy, TripDetailSpecial} from "_types/tripPlan/tripDetailInfo";
import {Approve} from "_types/approve/index";
import {AgencyOperateLog} from "_types/agency/agency-operate-log";
import {TripFuelAddPackage} from "../_types/tripPackage/tripFuelAddPackage";
import {TripBasicPackage} from "../_types/tripPackage/tripBasicPackage";
import {ErrorLog} from "../_types/errorLog";
import {CompanyRegion} from "_types/travelPolicy/companyRegion";
import {RegionPlace} from "_types/travelPolicy/regionPlace";
initModels({
    staff: createServerService<Staff>(Staff),
    credential: createServerService<Credential>(Credential),
    pointChange: createServerService<PointChange>(PointChange),
    invitedLink: createServerService<InvitedLink>(InvitedLink),
    staffSupplierInfo: createServerService<StaffSupplierInfo>(StaffSupplierInfo),
    company: createServerService<Company>(Company),
    supplier: createServerService<Supplier>(Supplier),
    tripPlanNumChange: createServerService<TripPlanNumChange>(TripPlanNumChange),
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
    tripDetailStaff: createServerService<TripDetailStaff>(TripDetailStaff),
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
    offline: createServerService<Offline>(Offline),

    ddtalkCorp: createServerService<DDTalkCorp>(DDTalkCorp),
    ddtalkUser: createServerService<DDTalkUser>(DDTalkUser),
    ddtalkDepartment : createServerService<DDTalkDepartment>(DDTalkDepartment),
    
    coinAccount: createServerService<CoinAccount>(CoinAccount),
    coinAccountChange: createServerService<CoinAccountChange>(CoinAccountChange),
    agencyOperateLog:createServerService<AgencyOperateLog>(AgencyOperateLog),
    tripFuelAddPackage: createServerService<TripFuelAddPackage>(TripFuelAddPackage),
    tripBasicPackage: createServerService<TripBasicPackage>(TripBasicPackage),
    errorLog: createServerService<ErrorLog>(ErrorLog),
    travelPolicyRegion: createServerService<TravelPolicyRegion>(TravelPolicyRegion),
    companyRegion: createServerService<CompanyRegion>(CompanyRegion),
    regionPlace: createServerService<RegionPlace>(RegionPlace),
});
