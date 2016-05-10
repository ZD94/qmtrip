
import { ServiceInterface, ModelsInterface, Models } from 'api/_types/index';
import { Staff } from './_types/staff';
import { Company } from './_types/company';
import { Department } from './_types/department';
import { TravelPolicy } from './_types/travelPolicy';
import { Agency, AgencyUser } from './_types/agency';
import { StaffService } from './staff/index';
import { CompanyService } from './company/index';
import { DepartmentService } from './department/index';
import { TravelPolicyService } from './travelPolicy/index';
import { AgencyService, AgencyUserService } from './agency/index';

class ServerModels implements ModelsInterface {
    staff: ServiceInterface<Staff>;
    company: ServiceInterface<Company>;
    department: ServiceInterface<Department>;
    travelPolicy: ServiceInterface<TravelPolicy>;
    agency: ServiceInterface<Agency>;
    agencyUser: ServiceInterface<AgencyUser>;

    constructor() {
        this.staff = new StaffService();
        this.company = new CompanyService();
        this.department = new DepartmentService();
        this.travelPolicy = new TravelPolicyService();
        this.agency = new AgencyService();
        this.agencyUser = new AgencyUserService();
    }
}

Models.init(new ServerModels());
