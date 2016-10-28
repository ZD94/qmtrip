

import ng = require('angular');
import L from 'common/language';

import { ModelsInterface, initModels } from 'api/_types';
import { ModelObjInterface } from 'common/model/interface';
import { ModelCached } from 'common/model/cached';
import { ModelRemote } from 'common/model/remote';
import { ngService } from '../index';
import { Staff, Credential, PointChange, InvitedLink, StaffSupplierInfo } from 'api/_types/staff';
import { Company, MoneyChange, Supplier } from 'api/_types/company';
import { Department } from 'api/_types/department';
import { TravelPolicy, SubsidyTemplate } from 'api/_types/travelPolicy';
import { AccordHotel } from 'api/_types/accordHotel';
import { Agency, AgencyUser } from 'api/_types/agency';
import {TripPlan, TripDetail, Project, TripPlanLog, TripApprove, FinanceCheckCode} from 'api/_types/tripPlan';
import {Account, Token, AccountOpenid} from 'api/_types/auth';
import { Seed } from 'api/_types/seed';
import {TravelBudgetLog} from "api/_types/travelbudget";
import {DDTalkCorp, DDTalkUser} from "api/_types/ddtalk";
import {CoinAccount, CoinAccountChange} from "api/_types/coin";
import {TripDetailInvoice, TripDetailHotel, TripDetailTraffic, TripDetailSubsidy, TripDetailSpecial} from "api/_types/tripPlan";

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
        funcs: ['getStaffSupplierInfo', 'getStaffSupplierInfos', 'createStaffSupplierInfo', 'updateStaffSupplierInfo']
    },
    company: { type: Company, modname: 'company',
        funcs: ['getCompany', 'listCompany', 'registerCompany', 'updateCompany', 'deleteCompany']
    },
    moneyChange: { type: MoneyChange, modname: 'company',
        funcs: ['getMoneyChange', 'listMoneyChange', 'saveMoneyChange']
    },
    supplier: { type: Supplier, modname: 'company',
        funcs: ['getSupplier', 'getSuppliers', 'createSupplier', 'updateSupplier', 'deleteSupplier']
    },
    department: { type: Department, modname: 'department',
        funcs: ['getDepartment', 'getDepartments', 'createDepartment', 'updateDepartment', 'deleteDepartment']
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
    agency: { type: Agency, modname: 'agency',
        funcs: ['getAgencyById', 'listAgency', 'registerAgency', 'updateAgency', 'deleteAgency']
    },
    agencyUser: { type: AgencyUser, modname: 'agency',
        funcs: ['getAgencyUser', 'listAgencyUser', 'createAgencyUser', 'updateAgencyUser', 'deleteAgencyUser']
    },
    tripApprove: { type: TripApprove, modname: 'tripPlan',
        funcs: ['getTripApprove', 'getTripApproves', 'saveTripApprove', 'updateTripApprove', 'deleteTripApprove']
    },
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
        funcs: ['getAccount', 'getAccounts', 'createAccount', null, 'deleteAccount']
    },
    seed: { type: Seed, modname: 'seeds',
        funcs: []
    },
    token: { type: Token, modname: 'token', funcs: []},
    //鲸币账户
    coinAccount: { type: CoinAccount, modname: 'coin', funcs: ['clientStaffCoinAccount']},
    coinAccountChange: { type: CoinAccountChange, modname: 'coin', funcs: []},

    financeCheckCode: { type: FinanceCheckCode, modname: 'tripPlan', funcs: ['getTripDetail']},
    tripDetailInvoice: { type: TripDetailInvoice, modname: 'tripPlan', funcs: ['getTripDetailInvoice', 'getTripDetailInvoices', 'saveTripDetailInvoice', 'updateTripDetailInvoice', 'deleteTripDetailInvoice']},
    tripDetailTraffic: { type: TripDetailTraffic, modname: 'tripPlan', funcs: ['getTripDetailTraffic']},
    tripDetailHotel: { type: TripDetailHotel, modname: 'tripPlan', funcs: ['getTripDetailHotel']},
    tripDetailSubsidy: { type: TripDetailSubsidy, modname: 'tripPlan', funcs: ['getTripDetailSubsidy']},
    tripDetailSpecial: { type: TripDetailSpecial, modname: 'tripPlan', funcs: ['getTripDetailSpecial']},
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
    return new ModelRemote<T>(options)
}

@ngService('Models')
class ClientModels implements ModelsInterface {

    staff: ModelRemote<Staff>;
    credential: ModelRemote<Credential>;
    pointChange:ModelRemote<PointChange>;
    invitedLink:ModelRemote<InvitedLink>;
    staffSupplierInfo:ModelRemote<StaffSupplierInfo>;
    company: ModelRemote<Company>;
    supplier: ModelRemote<Supplier>;
    department: ModelRemote<Department>;
    travelPolicy: ModelRemote<TravelPolicy>;
    subsidyTemplate: ModelRemote<SubsidyTemplate>;
    accordHotel: ModelRemote<AccordHotel>;
    agency: ModelRemote<Agency>;
    agencyUser: ModelRemote<AgencyUser>;
    tripPlan: ModelRemote<TripPlan>;
    tripDetail: ModelRemote<TripDetail>;
    tripDetailTraffic: ModelRemote<TripDetailTraffic>;
    tripDetailHotel: ModelRemote<TripDetailHotel>;
    tripDetailSubsidy: ModelRemote<TripDetailSubsidy>;
    tripDetailInvoice: ModelRemote<TripDetailInvoice>;
    tripDetailSpecial: ModelRemote<TripDetailSpecial>;

    tripPlanLog: ModelRemote<TripPlanLog>;
    moneyChange: ModelRemote<MoneyChange>;
    project: ModelRemote<Project>;
    tripApprove: ModelRemote<TripApprove>;
    //place: ModelRemote<Place>;
    account: ModelRemote<Account>;
    seed: ModelRemote<Seed>;
    token: ModelRemote<Token>;
    accountOpenid: ModelRemote<AccountOpenid>;
    travelBudgetLog: ModelRemote<TravelBudgetLog>;
    financeCheckCode: ModelRemote<FinanceCheckCode>;
    
    ddtalkCorp: ModelRemote<DDTalkCorp>;
    ddtalkUser: ModelRemote<DDTalkUser>;

    coinAccount: ModelRemote<CoinAccount>;
    coinAccountChange: ModelRemote<CoinAccountChange>;

    constructor($cacheFactory: ng.ICacheFactoryService) {
        this.staff = createService<Staff>(Services.staff, $cacheFactory);
        this.credential = createService<Credential>(Services.credential, $cacheFactory);
        this.pointChange = createService<PointChange>(Services.pointChange, $cacheFactory);
        this.supplier = createService<Supplier>(Services.supplier, $cacheFactory);
        this.invitedLink = createService<InvitedLink>(Services.invitedLink, $cacheFactory);
        this.staffSupplierInfo = createService<StaffSupplierInfo>(Services.staffSupplierInfo, $cacheFactory);
        this.company = createService<Company>(Services.company, $cacheFactory);
        this.department = createService<Department>(Services.department, $cacheFactory);
        this.travelPolicy = createService<TravelPolicy>(Services.travelPolicy, $cacheFactory);
        this.subsidyTemplate = createService<SubsidyTemplate>(Services.subsidyTemplate, $cacheFactory);
        this.accordHotel = createService<AccordHotel>(Services.accordHotel, $cacheFactory);
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
        initModels(this);

        API.on('beforeConnect', this.clearCache.bind(this));
    }

    clearCache(){
        for(let k in this){
            if(this[k] instanceof ModelCached)
                this[k].clearCache();
        }
    }
}



import './menu';
import './place';
