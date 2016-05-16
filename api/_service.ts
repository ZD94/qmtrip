
import { initModels } from 'api/_types';
import { StaffService, CredentialService, PointChangeService } from 'api/staff';
import { CompanyService, MoneyChangeService } from 'api/company';
import { DepartmentService } from 'api/department';
import { TravelPolicyService } from 'api/travelPolicy';
import agency = require('api/agency');
import {TripPlanService, TripDetailService, ProjectService} from 'api/tripPlan';

initModels({
    staff: new StaffService(),
    credential: new CredentialService(),
    pointChange: new PointChangeService(),
    company: new CompanyService(),
    department: new DepartmentService(),
    travelPolicy: new TravelPolicyService(),
    agency: new agency.AgencyService(),
    agencyUser: new agency.AgencyUserService(),
    tripPlan: new TripPlanService(),
    tripDetail: new TripDetailService(),
    moneyChange: new MoneyChangeService(),
    project: new ProjectService(),
    account: null,
});
