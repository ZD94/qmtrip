
import { initModels } from '_types';

import { Staff, Credential, PointChange, InvitedLink, StaffSupplierInfo, StaffProperty } from '_types/staff';
import { Company, MoneyChange, Supplier, TripPlanNumChange, CompanyProperty, InvoiceTitle } from '_types/company';
import { Department, StaffDepartment, DepartmentProperty } from '_types/department';
import { PromoCode } from '_types/promoCode';

import { AccordHotel } from '_types/accordHotel';
import { Notice, NoticeAccount } from '_types/notice';
import { Agency, AgencyUser } from '_types/agency';
import {
    TripPlan, TripDetail, TripDetailStaff, Project, TripPlanLog, FinanceCheckCode,
    TripDetailInvoice, TripDetailTraffic, TripDetailHotel, Offline, ProjectBudgetLog, ProjectStaff, ProjectStaffTravelPolicy
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
import {EventListener} from "../_types/eventListener";
// import {CompanyRegion} from "_types/travelPolicy/companyRegion";
// import {RegionPlace} from "_types/travelPolicy/regionPlace";
// import { TravelPolicy, SubsidyTemplate,TravelPolicyRegion } from '_types/travelPolicy';
import {Url} from "_types/shorturl";
import {EmailQueue, EmailLog, EmailSubmit} from "_types/mail";

initModels({
    staff: createServerService<Staff>(Staff),
    staffProperty: createServerService<StaffProperty>(StaffProperty),
    credential: createServerService<Credential>(Credential),
    pointChange: createServerService<PointChange>(PointChange),
    invitedLink: createServerService<InvitedLink>(InvitedLink),
    staffSupplierInfo: createServerService<StaffSupplierInfo>(StaffSupplierInfo),
    company: createServerService<Company>(Company),
    companyProperty: createServerService<CompanyProperty>(CompanyProperty),
    supplier: createServerService<Supplier>(Supplier),
    invoiceTitle: createServerService<InvoiceTitle>(InvoiceTitle),
    tripPlanNumChange: createServerService<TripPlanNumChange>(TripPlanNumChange),
    promoCode: createServerService<PromoCode>(PromoCode),
    department: createServerService<Department>(Department),
    departmentProperty: createServerService<DepartmentProperty>(DepartmentProperty),
    staffDepartment: createServerService<StaffDepartment>(StaffDepartment),
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
    projectStaff: createServerService<ProjectStaff>(ProjectStaff),
    projectBudgetLog: createServerService<ProjectBudgetLog>(ProjectBudgetLog),
    projectStaffTravelPolicy: createServerService<ProjectStaffTravelPolicy>(ProjectStaffTravelPolicy),
    // tripApprove: createServerService<TripApprove>(TripApprove),
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
    eventListener: createServerService<EventListener>(EventListener),

    url: createServerService<Url>(Url),
    emailQueue: createServerService<EmailQueue>(EmailQueue),
    emailLog: createServerService<EmailLog>(EmailLog),
    emailSubmit: createServerService<EmailSubmit>(EmailSubmit),

    // travelPolicyRegion: createServerService<TravelPolicyRegion>(TravelPolicyRegion),
    // companyRegion: createServerService<CompanyRegion>(CompanyRegion),
    // regionPlace: createServerService<RegionPlace>(RegionPlace),
    // travelPolicy: createServerService<TravelPolicy>(TravelPolicy),
    // subsidyTemplate: createServerService<SubsidyTemplate>(SubsidyTemplate),
});
