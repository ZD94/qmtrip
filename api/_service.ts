
import { initModels } from 'api/_types';
import StaffModule = require('api/staff');
import { CompanyService, MoneyChangeService } from 'api/company';
import DepartmentModule = require ('api/department');
import TravelPolicyModule = require('api/travelPolicy');
import { AgencyService, AgencyUserService } from 'api/agency';
import {TripPlanService, TripDetailService, ProjectService} from 'api/tripPlan';

initModels({
    staff: new StaffModule.StaffService(),
    credential: new StaffModule.CredentialService(),
    pointChange: new StaffModule.PointChangeService(),
    company: new CompanyService(),
    department: new DepartmentModule.DepartmentService(),
    travelPolicy: new TravelPolicyModule.TravelPolicyService(),
    agency: new AgencyService(),
    agencyUser: new AgencyUserService(),
    tripPlan: new TripPlanService(),
    tripDetail: new TripDetailService(),
    moneyChange: new MoneyChangeService(),
    project: new ProjectService(),
    account: null,
});
