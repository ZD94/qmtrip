

import ng = require('angular');
import L = require('common/language');

import { ModelsInterface, initModels } from 'api/_types';
import { ModelObjInterface } from 'common/model/interface';
import { ModelCached } from '../../common/model/cached';
import { ModelRemote } from 'common/model/remote';
import { ngService } from '../index';
import { Staff, Credential, PointChange, InvitedLink } from 'api/_types/staff';
import { Company, MoneyChange } from 'api/_types/company';
import { Department } from 'api/_types/department';
import { TravelPolicy } from 'api/_types/travelPolicy';
import { AccordHotel } from 'api/_types/accordHotel';
import { Agency, AgencyUser } from 'api/_types/agency';
import {TripPlan, TripDetail, Project, TripPlanLog, TripApprove} from 'api/_types/tripPlan';
import { Place } from 'api/_types/place';
import {Account, Token, AccountOpenid} from 'api/_types/auth';
import { Seed } from 'api/_types/seed';

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
    company: { type: Company, modname: 'company',
        funcs: ['getCompany', 'listCompany', 'registerCompany', 'updateCompany', 'deleteCompany']
    },
    moneyChange: { type: MoneyChange, modname: 'company',
        funcs: ['getMoneyChange', 'listMoneyChange', 'saveMoneyChange']
    },
    department: { type: Department, modname: 'department',
        funcs: ['getDepartment', 'getDepartments', 'createDepartment', 'updateDepartment', 'deleteDepartment']
    },
    travelPolicy: { type: TravelPolicy, modname: 'travelPolicy',
        funcs: ['getTravelPolicy', 'getTravelPolicies', 'createTravelPolicy', 'updateTravelPolicy', 'deleteTravelPolicy']
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
    token: { type: Token, modname: 'token', funcs: []}
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
    company: ModelRemote<Company>;
    department: ModelRemote<Department>;
    travelPolicy: ModelRemote<TravelPolicy>;
    accordHotel: ModelRemote<AccordHotel>;
    agency: ModelRemote<Agency>;
    agencyUser: ModelRemote<AgencyUser>;
    tripPlan: ModelRemote<TripPlan>;
    tripDetail: ModelRemote<TripDetail>;
    tripPlanLog: ModelRemote<TripPlanLog>;
    moneyChange: ModelRemote<MoneyChange>;
    project: ModelRemote<Project>;
    tripApprove: ModelRemote<TripApprove>;
    //place: ModelRemote<Place>;
    account: ModelRemote<Account>;
    seed: ModelRemote<Seed>;
    token: ModelRemote<Token>;
    accountOpenid: ModelRemote<AccountOpenid>;

    constructor($cacheFactory: ng.ICacheFactoryService) {
        this.staff = createService<Staff>(Services.staff, $cacheFactory);
        this.credential = createService<Credential>(Services.credential, $cacheFactory);
        this.pointChange = createService<PointChange>(Services.pointChange, $cacheFactory);
        this.invitedLink = createService<InvitedLink>(Services.invitedLink, $cacheFactory);
        this.company = createService<Company>(Services.company, $cacheFactory);
        this.department = createService<Department>(Services.department, $cacheFactory);
        this.travelPolicy = createService<TravelPolicy>(Services.travelPolicy, $cacheFactory);
        this.accordHotel = createService<AccordHotel>(Services.accordHotel, $cacheFactory);
        this.agency = createService<Agency>(Services.agency, $cacheFactory);
        this.agencyUser = createService<AgencyUser>(Services.agencyUser, $cacheFactory);
        this.tripPlan = createService<TripPlan>(Services.tripPlan, $cacheFactory);
        this.tripDetail = createService<TripDetail>(Services.tripDetail, $cacheFactory);
        this.tripPlanLog = createService<TripPlanLog>(Services.tripPlanLog, $cacheFactory);
        this.moneyChange = createService<MoneyChange>(Services.moneyChange, $cacheFactory);
        this.project = createService<Project>(Services.project, $cacheFactory);
        //this.place = createService<Place>(Services.place, $cacheFactory);
        this.account = createService<Account>(Services.account, $cacheFactory);
        this.token = createService<Token>(Services.token, $cacheFactory);
        this.seed = createService<Seed>(Services.seed, $cacheFactory);
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

