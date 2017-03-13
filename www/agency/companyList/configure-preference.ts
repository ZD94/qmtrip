import {AgencyUser} from "api/_types/agency/agency-user";
/**
 * Created by chen on 2017/3/13.
 */
export async function ConfigurePreferenceController($scope,Models,$stateParams){
    let companyId = $stateParams.companyId;
    let agencyUser = await AgencyUser.getCurrent();
    let company = await Models.company.get(companyId);
    $scope.configure = async function(){

    }

}