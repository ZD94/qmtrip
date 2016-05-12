
import { ServiceInterface, ModelsInterface, Models } from 'api/_types/index';
import { Staff, Credential } from './_types/staff';
import { Company } from './_types/company';
import { Department } from './_types/department';
import { TravelPolicy } from './_types/travelPolicy';
import { Agency, AgencyUser } from './_types/agency';
import { StaffService, CredentialService} from './staff/index';
import { TripPlan, TripDetail } from './_types/tripPlan';
import { CompanyService } from './company/index';
import { DepartmentService } from './department/index';
import { TravelPolicyService } from './travelPolicy/index';
import { AgencyService, AgencyUserService } from './agency/index';
import { TripPlanService, TripDetailService } from './tripPlan/index';

class ServerModels implements ModelsInterface {
    staff: ServiceInterface<Staff>;
    credential: ServiceInterface<Credential>;
    company: ServiceInterface<Company>;
    department: ServiceInterface<Department>;
    travelPolicy: ServiceInterface<TravelPolicy>;
    agency: ServiceInterface<Agency>;
    agencyUser: ServiceInterface<AgencyUser>;
    tripPlan: ServiceInterface<TripPlan>;
    tripDetail: ServiceInterface<TripDetail>;

    constructor() {
        this.staff = new StaffService();
        this.credential = new CredentialService();
        this.company = new CompanyService();
        this.department = new DepartmentService();
        this.travelPolicy = new TravelPolicyService();
        this.agency = new AgencyService();
        this.agencyUser = new AgencyUserService();
        this.tripPlan = new TripPlanService();
        this.tripDetail = new TripDetailService();
    }
}

Models.init(new ServerModels());
