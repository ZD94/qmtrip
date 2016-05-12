
import { initModels } from 'api/_types';
import { StaffService } from 'api/staff';
import { CompanyService } from 'api/company';
import { DepartmentService } from 'api/department';
import { TravelPolicyService } from 'api/travelPolicy';
import { AgencyService, AgencyUserService } from 'api/agency';
import { TripPlanService, TripDetailService } from 'api/tripPlan';

initModels({
    staff: new StaffService(),
    company: new CompanyService(),
    department: new DepartmentService(),
    travelPolicy: new TravelPolicyService(),
    agency: new AgencyService(),
    agencyUser: new AgencyUserService(),
    tripPlan: new TripPlanService(),
    tripDetail: new TripDetailService(),
});
