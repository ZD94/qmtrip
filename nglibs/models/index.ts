

import ng = require('angular');

import { ModelsInterface, initModels } from 'api/_types';
import { StaffService, CredentialService } from 'api/staff/client';
import { CompanyService, MoneyChangeService} from 'api/company/client';
import { DepartmentService } from 'api/department/client';
import { TravelPolicyService } from 'api/travelPolicy/client';
import { AgencyService, AgencyUserService } from 'api/agency/client';
import {TripPlanService, TripDetailService, ProjectService} from 'api/tripPlan/client';

const API = require('common/api');

export function ngService(name: string) {
    return function(constructor: Function) {
        angular.module('nglibs')
            .service(name, constructor);
    };
}

@ngService('Models')
class ClientModels implements ModelsInterface {
    
    staff: StaffService;
    credential: CredentialService;
    company: CompanyService;
    department: DepartmentService;
    travelPolicy: TravelPolicyService;
    agency: AgencyService;
    agencyUser: AgencyUserService;
    tripPlan: TripPlanService;
    tripDetail: TripDetailService;
    moneyChange: MoneyChangeService;
    project: ProjectService;

    constructor($cacheFactory: ng.ICacheFactoryService) {
        this.staff = new StaffService($cacheFactory);
        this.credential = new CredentialService($cacheFactory);
        this.company = new CompanyService($cacheFactory);
        this.department = new DepartmentService($cacheFactory);
        this.travelPolicy = new TravelPolicyService($cacheFactory);
        this.agency = new AgencyService($cacheFactory);
        this.agencyUser = new AgencyUserService($cacheFactory);
        this.tripPlan = new TripPlanService($cacheFactory);
        this.tripDetail = new TripDetailService($cacheFactory);
        this.moneyChange = new MoneyChangeService($cacheFactory);
        this.project = new ProjectService($cacheFactory);

        initModels(this);
    }
}

import './menu';
import './place';