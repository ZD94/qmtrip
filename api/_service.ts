
import { initModels } from 'api/_types';

import StaffModule = require('api/staff');
import DepartmentModule = require ('api/department');
import TravelPolicyModule = require('api/travelPolicy');

let { AgencyService, AgencyUserService } = require('api/agency');
let { CompanyService, MoneyChangeService } = require('api/company');
let { TripPlanService, TripDetailService, ProjectService } = require('api/tripPlan');

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
    seed: null,
});
