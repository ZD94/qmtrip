/**
 * Created by chen on 2017/3/13.
 */
import {AgencyUser} from "api/_types/agency/agency-user";
let msgbox=require("msgbox");
export async function ConfigurePreferenceController($scope,Models,$stateParams){
    let companyId = $stateParams.companyId;
    let agencyUser = await AgencyUser.getCurrent();
    let company = await Models.company.get(companyId);
    $scope.hotel = '';
    $scope.traffic = '';
    $scope.abroadHotel = '';
    $scope.abroadTraffic = '';
    let budgetConfig ;
    if(company.budgetConfig){
        if(typeof company.budgetConfig != 'object'){
            budgetConfig = JSON.parse(company.budgetConfig);
        }else{
            budgetConfig = company.budgetConfig;
        }
        console.info(budgetConfig);
        $scope.hotel = JSON.stringify(budgetConfig.hotel) ;
        $scope.traffic = JSON.stringify(budgetConfig.traffic) ;
        $scope.abroadHotel = JSON.stringify(budgetConfig.abroadHotel) ;
        console.info(JSON.stringify(budgetConfig.abroadHotel));
        $scope.abroadTraffic =JSON.stringify(budgetConfig.abroadTraffic) ;
        console.info(JSON.stringify(budgetConfig.abroadTraffic));

    }
    $scope.configure = async function(){
        let obj:any ={};
        obj.hotel = $scope.hotel ;
        obj.traffic = $scope.traffic;
        obj.abroadHotel = $scope.abroadHotel;
        obj.abroadTraffic = $scope.abroadTraffic;
        obj = JSON.stringify(obj);
        let res = await agencyUser.configPreference(companyId, obj);
        msgbox.alert("配置成功");
    }
}