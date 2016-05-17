

import ng = require('angular');
import L = require('common/language');

import { ModelsInterface, initModels } from 'api/_types';
import { RemoteService, ModelObject, Resolvable } from 'common/model.client';
import { ngService } from '../index';
import { Staff, Credential, PointChange } from 'api/_types/staff';
import { Company, MoneyChange } from 'api/_types/company';
import { Department } from 'api/_types/department';
import { TravelPolicy } from 'api/_types/travelPolicy';
import { Agency, AgencyUser } from 'api/_types/agency';
import { TripPlan, TripDetail, Project } from 'api/_types/tripPlan';
import { Place } from 'api/_types/place';
import { Account } from 'api/_types/auth';
import { Seed } from 'api/_types/seed';

const API = require('common/api');

function resolverAPIModule(modname: string){
    return function(){
        API.require(modname);
        return API.onload();
    }
}

var Services = {
    staff: { type: Staff, modname: 'staff',
        funcs: ['getStaff', 'getStaffs', 'createStaff', 'updateStaff', 'deleteStaff']
    },
    credential: { type: Credential, modname: 'staff',
        funcs: ['getPapersById', 'getOnesPapers', 'createPapers', 'updatePapers', 'deletePapers']
    },
    pointChange: { type: PointChange, modname: 'staff',
        funcs: ['getPointChange', 'getPointChanges']
    },
    company: { type: Company, modname: 'company',
        funcs: ['getCompany', 'listCompany', 'createCompany', 'updateCompany', 'deleteCompany']
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
    agency: { type: Agency, modname: 'agency',
        funcs: ['getAgencyById', 'listAgency', 'createAgency', 'updateAgency', 'deleteAgency']
    },
    agencyUser: { type: AgencyUser, modname: 'agency',
        funcs: ['getAgencyUser', 'listAndPaginateAgencyUser', 'createAgencyUser', 'updateAgencyUser', 'deleteAgencyUser']
    },
    tripPlan: { type: TripPlan, modname: 'tripPlan',
        funcs: ['getTripPlan', 'listTripPlans', 'saveTripPlan', 'updateTripPlanOrder', 'deleteTripPlan']
    },
    tripDetail: { type: TripDetail, modname: 'tripPlan',
        funcs: ['getTripDetail', 'getTripPlanDetails', 'saveTripDetail', 'updateTripPlanOrder', 'deleteTripPlan']
    },
    project: { type: Project, modname: 'tripPlan',
        funcs: ['getProjectById', 'getProjectList', 'createNewProject', null, 'deleteProject']
    },
    place: { type: Place, modname: 'place',
        funcs: ['getCityInfo', 'queryPlace']
    },
    account: { type: Account, modname: 'auth',
        funcs: []
    },
    seed: { type: Seed, modname: 'seeds',
        funcs: []
    },
};

function createService<T extends Resolvable>(options: any, cacheFactory: ng.ICacheFactoryService){
    options.cache = cacheFactory(options.type.name);
    options.resolve = resolverAPIModule(options.modname);
    options.funcGet = options.funcs[0] || function(){ throw L.ERR.NOT_IMPLEMENTED; };
    options.funcFind = options.funcs[1] || function(){ throw L.ERR.NOT_IMPLEMENTED; };
    options.funcCreate = options.funcs[2] || function(){ throw L.ERR.NOT_IMPLEMENTED; };
    options.funcUpdate = options.funcs[3] || function(){ throw L.ERR.NOT_IMPLEMENTED; };
    options.funcDelete = options.funcs[4] || function(){ throw L.ERR.NOT_IMPLEMENTED; };
    return new RemoteService<T>(options)
}

@ngService('Models')
class ClientModels implements ModelsInterface {

    staff: RemoteService<Staff>;
    credential: RemoteService<Credential>;
    pointChange:RemoteService<PointChange>;
    company: RemoteService<Company>;
    department: RemoteService<Department>;
    travelPolicy: RemoteService<TravelPolicy>;
    agency: RemoteService<Agency>;
    agencyUser: RemoteService<AgencyUser>;
    tripPlan: RemoteService<TripPlan>;
    tripDetail: RemoteService<TripDetail>;
    moneyChange: RemoteService<MoneyChange>;
    project: RemoteService<Project>;
    place: RemoteService<Place>;
    account: RemoteService<Account>;
    seed: RemoteService<Seed>;
    
    constructor($cacheFactory: ng.ICacheFactoryService) {
        this.staff = createService<Staff>(Services.staff, $cacheFactory);
        this.credential = createService<Credential>(Services.credential, $cacheFactory);
        this.pointChange = createService<PointChange>(Services.pointChange, $cacheFactory);
        this.company = createService<Company>(Services.company, $cacheFactory);
        this.department = createService<Department>(Services.department, $cacheFactory);
        this.travelPolicy = createService<TravelPolicy>(Services.travelPolicy, $cacheFactory);
        this.agency = createService<Agency>(Services.agency, $cacheFactory);
        this.agencyUser = createService<AgencyUser>(Services.agencyUser, $cacheFactory);
        this.tripPlan = createService<TripPlan>(Services.tripPlan, $cacheFactory);
        this.tripDetail = createService<TripDetail>(Services.tripDetail, $cacheFactory);
        this.moneyChange = createService<MoneyChange>(Services.moneyChange, $cacheFactory);
        this.project = createService<Project>(Services.project, $cacheFactory);
        this.place = createService<Place>(Services.place, $cacheFactory);
        this.account = createService<Account>(Services.account, $cacheFactory);
        this.seed = createService<Seed>(Services.seed, $cacheFactory);
        initModels(this);
    }
}

import './menu';
import './place';

