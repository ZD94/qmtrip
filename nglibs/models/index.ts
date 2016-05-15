

import ng = require('angular');

import { ModelsInterface, initModels } from 'api/_types';
import { StaffService, CredentialService , PointChangeService} from 'api/staff/client';
import { CompanyService, MoneyChangeService} from 'api/company/client';
import { DepartmentService } from 'api/department/client';
import { TravelPolicyService } from 'api/travelPolicy/client';
import { AgencyService, AgencyUserService } from 'api/agency/client';
import { TripPlanService, TripDetailService, ProjectService } from 'api/tripPlan/client';
import { PlaceService } from 'api/client/place/client';
import { ngService } from '../index';

const API = require('common/api');

@ngService('Models')
class ClientModels implements ModelsInterface {

    staff: StaffService;
    credential: CredentialService;
    pointChange:PointChangeService;
    company: CompanyService;
    department: DepartmentService;
    travelPolicy: TravelPolicyService;
    agency: AgencyService;
    agencyUser: AgencyUserService;
    tripPlan: TripPlanService;
    tripDetail: TripDetailService;
    moneyChange: MoneyChangeService;
    project: ProjectService;
    place: PlaceService;
    account: any;

    constructor($cacheFactory: ng.ICacheFactoryService) {
        this.staff = new StaffService($cacheFactory);
        this.credential = new CredentialService($cacheFactory);
        this.pointChange =  new PointChangeService($cacheFactory);
        this.company = new CompanyService($cacheFactory);
        this.department = new DepartmentService($cacheFactory);
        this.travelPolicy = new TravelPolicyService($cacheFactory);
        this.agency = new AgencyService($cacheFactory);
        this.agencyUser = new AgencyUserService($cacheFactory);
        this.tripPlan = new TripPlanService($cacheFactory);
        this.tripDetail = new TripDetailService($cacheFactory);
        this.moneyChange = new MoneyChangeService($cacheFactory);
        this.project = new ProjectService($cacheFactory);
        this.place = new PlaceService($cacheFactory);
        this.account = null;
        initModels(this);
    }
}

import './menu';
import './place';
