
import { initModels } from 'api/_types';
import { StaffService, CredentialService } from 'api/staff';
import { CompanyService, MoneyChangeService } from 'api/company';
import { DepartmentService } from 'api/department';
import { TravelPolicyService } from 'api/travelPolicy';
import { AgencyService, AgencyUserService } from 'api/agency';
import { TripPlanService, TripDetailService } from 'api/tripPlan';

initModels({
    staff: new StaffService(),
    credential: new CredentialService(),
    company: new CompanyService(),
    department: new DepartmentService(),
    travelPolicy: new TravelPolicyService(),
    agency: new AgencyService(),
    agencyUser: new AgencyUserService(),
    tripPlan: new TripPlanService(),
    tripDetail: new TripDetailService(),
    moneyChange: new MoneyChangeService(),
});
