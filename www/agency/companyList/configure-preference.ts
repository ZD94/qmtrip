/**
 * Created by chen on 2017/3/13.
 */
import {AgencyUser} from "api/_types/agency/agency-user";
let msgbox=require("msgbox");
export async function ConfigurePreferenceController($scope,Models,$stateParams){
    let companyId = $stateParams.companyId;
    let agencyUser = await AgencyUser.getCurrent();
    let company = await Models.company.get(companyId);
    $scope.configure = async function(){
       let res = await agencyUser.configPreference(companyId, $scope.preferenceText);
        msgbox.alert("配置成功");
    }
}