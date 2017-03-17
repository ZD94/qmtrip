

import ng = require('angular');
import L from 'common/language';

import { ModelsInterface, initModels } from 'api/_types';
import {ModelObjInterface, ModelInterface} from 'common/model/interface';
import { ModelCached } from 'common/model/cached';
import {ModelRemote, ModelRemoteOld} from 'common/model/remote';
import { ngService } from '../index';
import { Staff, Credential, PointChange, InvitedLink, StaffSupplierInfo } from 'api/_types/staff';
import { Company, MoneyChange, Supplier, TripPlanNumChange } from 'api/_types/company';
import { PromoCode } from 'api/_types/promoCode';
import { Department, StaffDepartment } from 'api/_types/department';
import { TravelPolicy, SubsidyTemplate } from 'api/_types/travelPolicy';
import { AccordHotel } from 'api/_types/accordHotel';
import { Notice, NoticeAccount } from 'api/_types/notice';
import { Agency, AgencyUser } from 'api/_types/agency';
import {TripPlan, TripDetail, Project, TripPlanLog, TripApprove, FinanceCheckCode} from 'api/_types/tripPlan';
import {Account, Token} from 'api/_types/auth';
import { Seed } from 'api/_types/seed';
import {TravelBudgetLog} from "api/_types/travelbudget";
import {DDTalkCorp, DDTalkUser} from "api/_types/ddtalk";
import {CoinAccount, CoinAccountChange} from "api/_types/coin";
import {TripDetailInvoice, TripDetailHotel, TripDetailTraffic, TripDetailSubsidy, TripDetailSpecial} from "api/_types/tripPlan";
import {Approve} from "api/_types/approve";
import {AgencyOperateLog} from "api/_types/agency/agency-operate-log";
import {DDTalkDepartment} from "api/_types/ddtalk";

const API = require('common/api');

function resolverAPIModule(modname: string){
    return function(){
        if(API[modname])
            return Promise.resolve();
        API.require(modname);
        return API.onload();
    }
}

function DummyGet(){
    return {
        save: function(){ return Promise.resolve(this); },
        destroy: function(){ Promise.resolve(); },
    };
}

var Services = {
    staff: { type: Staff, modname: 'staff',
        funcs: ['getStaff', 'getStaffs', 'createStaff', 'updateStaff', 'deleteStaff']
    },
    credential: { type: Credential, modname: 'staff',
        funcs: ['getPapersById', null, 'createPapers', 'updatePapers', 'deletePapers']
    },
    pointChange: { type: PointChange, modname: 'staff',
        funcs: ['getPointChange', 'getPointChanges']
    },
    invitedLink: { type: InvitedLink, modname: 'staff',
        funcs: ['getInvitedLink', 'getInvitedLinks', 'createInvitedLink', 'updateInvitedLink']
    },
    staffSupplierInfo: { type: StaffSupplierInfo, modname: 'staff',
        funcs: ['getStaffSupplierInfo', 'getStaffSupplierInfos', 'createStaffSupplierInfo', 'updateStaffSupplierInfo', 'deleteStaffSupplierInfo']
    },
    company: { type: Company, modname: 'company',
        funcs: ['getCompany', 'listCompany', 'registerCompany', 'updateCompany', 'deleteCompany']
    },
    moneyChange: { type: MoneyChange, modname: 'company',
        funcs: ['getMoneyChange', 'listMoneyChange', 'saveMoneyChange']
    },
    tripPlanNumChange: { type: TripPlanNumChange, modname: 'company',
        funcs: ['getTripPlanNumChange', 'getTripPlanNumChanges', 'createTripPlanNumChange']
    },
    supplier: { type: Supplier, modname: 'company',
        funcs: ['getSupplier', 'getSuppliers', 'createSupplier', 'updateSupplier', 'deleteSupplier']
    },
    promoCode: { type: PromoCode, modname: 'promoCode',
        funcs: ['getPromoCode', 'getPromoCodes', 'createPromoCode', 'updatePromoCode', 'deletePromoCode']
    },
    department: { type: Department, modname: 'department',
        funcs: ['getDepartment', 'getDepartments', 'createDepartment', 'updateDepartment', 'deleteDepartment']
    },
    staffDepartment: { type: StaffDepartment, modname: 'department',
        funcs: ['getStaffDepartment', 'getStaffDepartments', 'createStaffDepartment', 'updateStaffDepartment', 'deleteStaffDepartment']
    },
    travelPolicy: { type: TravelPolicy, modname: 'travelPolicy',
        funcs: ['getTravelPolicy', 'getTravelPolicies', 'createTravelPolicy', 'updateTravelPolicy', 'deleteTravelPolicy']
    },
    subsidyTemplate: { type: SubsidyTemplate, modname: 'travelPolicy',
        funcs: ['getSubsidyTemplate', 'getSubsidyTemplates', 'createSubsidyTemplate', 'updateSubsidyTemplate', 'deleteSubsidyTemplate']
    },
    accordHotel: { type: AccordHotel, modname: 'accordHotel',
        funcs: ['getAccordHotel', 'getAccordHotels', 'createAccordHotel', 'updateAccordHotel', 'deleteAccordHotel']
    },
    notice: { type: Notice, modname: 'notice',
        funcs: ['getNotice', 'getNotices', 'createNotice', 'updateNotice', 'deleteNotice']
    },
    noticeAccount: { type: NoticeAccount, modname: 'notice',
        funcs: ['getNoticeAccount', 'getNoticeAccounts', 'createNoticeAccount', 'updateNoticeAccount', 'deleteNoticeAccount']
    },
    agency: { type: Agency, modname: 'agency',
        funcs: ['getAgencyById', 'listAgency', 'registerAgency', 'updateAgency', 'deleteAgency']
    },
    agencyUser: { type: AgencyUser, modname: 'agency',
        funcs: ['getAgencyUser', 'listAgencyUser', 'createAgencyUser', 'updateAgencyUser', 'deleteAgencyUser']
    },
    tripApprove: { type: TripApprove, modname: 'tripApprove',
        funcs: ['getTripApprove', 'getTripApproves', 'saveTripApprove', 'updateTripApprove', 'deleteTripApprove']
    },
    approve: { type: Approve, modname: 'approve', funcs: [null, null, 'submitApprove']},
    tripPlan: { type: TripPlan, modname: 'tripPlan',
        funcs: ['getTripPlan', 'listTripPlans', 'saveTripPlan', 'updateTripPlan', 'deleteTripPlan']
    },
    tripDetail: { type: TripDetail, modname: 'tripPlan',
        funcs: ['getTripDetail', 'getTripDetails', 'saveTripDetail', 'updateTripDetail', 'deleteTripDetail']
    },
    tripPlanLog: { type: TripPlanLog, modname: 'tripPlan',
        funcs: ['getTripPlanLog', 'getTripPlanLogs', 'saveTripPlanLog', 'updateTripPlanLog', 'deleteTripPlanLog']
    },
    project: { type: Project, modname: 'tripPlan',
        funcs: ['getProjectById', 'getProjectList', 'createProject']
    },
    // place: { type: Place, modname: 'place',
    //     funcs: ['getCityInfo', 'queryPlace']
    // },
    account: { type: Account, modname: 'auth',
        funcs: ['getAccount', 'getAccounts', null, 'updateAccount', 'deleteAccount']
    },
    seed: { type: Seed, modname: 'seeds',
        funcs: []
    },
    token: { type: Token, modname: 'token', funcs: []},
    //鲸币账户
    coinAccount: { type: CoinAccount, modname: 'coin', funcs: ['getCoinAccount']},
    coinAccountChange: { type: CoinAccountChange, modname: 'coin', funcs: ['getCoinAccountChange','getCoinAccountChanges']},

    financeCheckCode: { type: FinanceCheckCode, modname: 'tripPlan', funcs: ['getTripDetail']},
    tripDetailInvoice: { type: TripDetailInvoice, modname: 'tripPlan', funcs: ['getTripDetailInvoice', 'getTripDetailInvoices', 'saveTripDetailInvoice', 'updateTripDetailInvoice', 'deleteTripDetailInvoice']},
    tripDetailTraffic: { type: TripDetailTraffic, modname: 'tripPlan', funcs: ['getTripDetailTraffic']},
    tripDetailHotel: { type: TripDetailHotel, modname: 'tripPlan', funcs: ['getTripDetailHotel']},
    tripDetailSubsidy: { type: TripDetailSubsidy, modname: 'tripPlan', funcs: ['getTripDetailSubsidy']},
    tripDetailSpecial: { type: TripDetailSpecial, modname: 'tripPlan', funcs: ['getTripDetailSpecial']},
    agencyOperateLog: { type: AgencyOperateLog, modname: 'agency', funcs: ['getAgencyOperateLog', 'getAgencyOperateLogs']}
};

function throwNotImplemented(){
    throw L.ERR.NOT_IMPLEMENTED();
}

function createService<T extends ModelObjInterface>(options: any, cacheFactory: ng.ICacheFactoryService){
    options.cache = cacheFactory(options.type.name);
    options.resolve = resolverAPIModule(options.modname);
    options.funcGet    = options.funcs[0] || throwNotImplemented;
    options.funcFind   = options.funcs[1] || throwNotImplemented;
    options.funcCreate = options.funcs[2] || throwNotImplemented;
    options.funcUpdate = options.funcs[3] || throwNotImplemented;
    options.funcDelete = options.funcs[4] || throwNotImplemented;
    return new ModelRemoteOld<T>(options)
}


function createRemoteService<T extends ModelObjInterface>(options: any, cacheFactory: ng.ICacheFactoryService){
    options.cache = cacheFactory(options.type.name);
    options.resolve = resolverAPIModule('model');
    return new ModelRemote<T>(options)
}


@ngService('Models')
class ClientModels implements ModelsInterface {

    staff: ModelInterface<Staff>;
    credential: ModelInterface<Credential>;
    pointChange:ModelInterface<PointChange>;
    invitedLink:ModelInterface<InvitedLink>;
    staffSupplierInfo:ModelInterface<StaffSupplierInfo>;
    company: ModelInterface<Company>;
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
    tripPlan: ModelInterface<TripPlan>;
    tripDetail: ModelInterface<TripDetail>;
    tripDetailTraffic: ModelInterface<TripDetailTraffic>;
    tripDetailHotel: ModelInterface<TripDetailHotel>;
    tripDetailSubsidy: ModelInterface<TripDetailSubsidy>;
    tripDetailInvoice: ModelInterface<TripDetailInvoice>;
    tripDetailSpecial: ModelInterface<TripDetailSpecial>;

    tripPlanLog: ModelInterface<TripPlanLog>;
    moneyChange: ModelInterface<MoneyChange>;
    project: ModelInterface<Project>;
    tripApprove: ModelInterface<TripApprove>;
    approve: ModelInterface<Approve>;
    //place: ModelRemote<Place>;
    account: ModelInterface<Account>;
    seed: ModelInterface<Seed>;
    token: ModelInterface<Token>;
    travelBudgetLog: ModelInterface<TravelBudgetLog>;
    financeCheckCode: ModelInterface<FinanceCheckCode>;
    
    ddtalkCorp: ModelInterface<DDTalkCorp>;
    ddtalkUser: ModelInterface<DDTalkUser>;

    coinAccount: ModelInterface<CoinAccount>;
    coinAccountChange: ModelInterface<CoinAccountChange>;
    agencyOperateLog: ModelInterface<AgencyOperateLog>;
    ddtalkDepartment: ModelInterface<DDTalkDepartment>;

    constructor($cacheFactory: ng.ICacheFactoryService, $rootScope: ng.IRootScopeService) {
        this.staff = createService<Staff>(Services.staff, $cacheFactory);
        this.credential = createService<Credential>(Services.credential, $cacheFactory);
        this.pointChange = createService<PointChange>(Services.pointChange, $cacheFactory);
        this.supplier = createService<Supplier>(Services.supplier, $cacheFactory);
        this.tripPlanNumChange = createService<TripPlanNumChange>(Services.tripPlanNumChange, $cacheFactory);
        this.invitedLink = createService<InvitedLink>(Services.invitedLink, $cacheFactory);
        this.staffSupplierInfo = createService<StaffSupplierInfo>(Services.staffSupplierInfo, $cacheFactory);
        this.company = createService<Company>(Services.company, $cacheFactory);
        this.promoCode = createService<PromoCode>(Services.promoCode, $cacheFactory);
        this.department = createService<Department>(Services.department, $cacheFactory);
        this.staffDepartment = createService<StaffDepartment>(Services.staffDepartment, $cacheFactory);
        this.travelPolicy = createService<TravelPolicy>(Services.travelPolicy, $cacheFactory);
        this.subsidyTemplate = createService<SubsidyTemplate>(Services.subsidyTemplate, $cacheFactory);
        this.accordHotel = createService<AccordHotel>(Services.accordHotel, $cacheFactory);
        this.notice = createService<Notice>(Services.notice, $cacheFactory);
        this.noticeAccount = createService<NoticeAccount>(Services.noticeAccount, $cacheFactory);
        this.agency = createService<Agency>(Services.agency, $cacheFactory);
        this.agencyUser = createService<AgencyUser>(Services.agencyUser, $cacheFactory);
        this.tripPlan = createService<TripPlan>(Services.tripPlan, $cacheFactory);
        this.tripDetail = createService<TripDetail>(Services.tripDetail, $cacheFactory);
        this.tripPlanLog = createService<TripPlanLog>(Services.tripPlanLog, $cacheFactory);
        this.moneyChange = createService<MoneyChange>(Services.moneyChange, $cacheFactory);
        this.project = createService<Project>(Services.project, $cacheFactory);
        this.tripApprove = createService<TripApprove>(Services.tripApprove, $cacheFactory);
        this.account = createService<Account>(Services.account, $cacheFactory);
        this.token = createService<Token>(Services.token, $cacheFactory);
        this.seed = createService<Seed>(Services.seed, $cacheFactory);
        this.coinAccount = createService<CoinAccount>(Services.coinAccount, $cacheFactory);
        this.coinAccountChange = createService<CoinAccountChange>(Services.coinAccountChange, $cacheFactory);
        this.tripDetailInvoice = createService<TripDetailInvoice>(Services.tripDetailInvoice, $cacheFactory);
        this.tripDetailTraffic = createService<TripDetailTraffic>(Services.tripDetailTraffic, $cacheFactory);
        this.tripDetailHotel = createService<TripDetailHotel>(Services.tripDetailHotel, $cacheFactory);
        this.tripDetailSubsidy = createService<TripDetailSubsidy>(Services.tripDetailSubsidy, $cacheFactory);
        this.tripDetailSpecial = createService<TripDetailSpecial>(Services.tripDetailSpecial, $cacheFactory);
        this.approve = createService<Approve>(Services.approve, $cacheFactory);
        this.agencyOperateLog = createService<AgencyOperateLog>(Services.agencyOperateLog, $cacheFactory);
        initModels(this);

        $rootScope.$on('$locationChangeSuccess', ()=>{
            for(let obj of this.$resetObjects){
                obj.$reset();
            }
            this.$resetObjects = [];
        });
        API.on('beforeConnect', this.clearCache.bind(this));
    }

    clearCache(){
        for(let k in this){
            let v = this[k];
            if(v instanceof ModelCached)
                v.clearCache();
        }
    }
    $resetObjects = [] as ModelObjInterface[];
    resetOnPageChange(obj: ModelObjInterface){
        this.$resetObjects.push(obj);
    }
}



import './menu';
import './place';
