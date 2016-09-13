import { StaffInvitedController } from '../company/staff-invited';
export async function CompanySecondController ($scope, $injector, wxApi){
    require("./company-guide.scss");
    return $injector.invoke(StaffInvitedController, $scope, {$scope});
}
