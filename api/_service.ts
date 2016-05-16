
import { initModels } from 'api/_types';
import { StaffService, CredentialService, PointChangeService } from 'api/staff';
import { DepartmentService } from 'api/department';
import { TravelPolicyService } from 'api/travelPolicy';
let { AgencyService, AgencyUserService } = require('api/agency');
let { CompanyService, MoneyChangeService } = require('api/company');
let { TripPlanService, TripDetailService, ProjectService } = require('api/tripPlan');

initModels({
    staff: new StaffService(),
    credential: new CredentialService(),
    pointChange: new PointChangeService(),
    company: new CompanyService(),
    department: new DepartmentService(),
    travelPolicy: new TravelPolicyService(),
    agency: new AgencyService(),
    agencyUser: new AgencyUserService(),
    tripPlan: new TripPlanService(),
    tripDetail: new TripDetailService(),
    moneyChange: new MoneyChangeService(),
    project: new ProjectService(),
    account: null,
});
