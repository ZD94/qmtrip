/**
 * Created by chen on 2017/3/13.
 */
import {AgencyUser} from "_types/agency/agency-user";
let msgbox=require("msgbox");
export async function ConfigurePreferController($scope,Models,$stateParams){
    let companyId = $stateParams.companyId;
    let agencyUser = await AgencyUser.getCurrent();
    let company = await Models.company.get(companyId);
    $scope.hotel = '';
    $scope.traffic = '';
    $scope.abroadHotel = '';
    $scope.abroadTraffic = '';
    let budgetConfig ;
    if(company.budgetConfig){
        if(typeof company.budgetConfig == 'string'){
            budgetConfig = JSON.parse(company.budgetConfig);
        }else{
            budgetConfig = company.budgetConfig;
        }
        $scope.hotel = tryConventToStr(budgetConfig.hotel);
        $scope.traffic = tryConventToStr(budgetConfig.traffic);
        $scope.abroadHotel = tryConventToStr(budgetConfig.abroadHotel) ;
        $scope.abroadTraffic =tryConventToStr(budgetConfig.abroadTraffic) ;
    }

    function tryConventToStr(obj) {
        if (typeof obj != 'string') {
            obj = JSON.stringify(obj)
        }
        return obj;
    }
    function tryConventToObj(str) {
        if (typeof str == 'string') {
            str = JSON.parse(str)
        }
        return str;
    }

    $scope.configure = async function(){
        if(!$scope.hotel){
            $scope.hotel = [];
        }
        if(!$scope.traffic){
            $scope.traffic =[];
        }
        if(!$scope.abroadHotel){
            $scope.abroadHotel =[];
        }
        if(!$scope.abroadTraffic){
            $scope.abroadTraffic = [];
        }
        let obj:any ={};
        obj.hotel = tryConventToObj($scope.hotel) ;
        obj.traffic = tryConventToObj($scope.traffic);
        obj.abroadHotel = tryConventToObj($scope.abroadHotel);
        obj.abroadTraffic = tryConventToObj($scope.abroadTraffic);
        let res = await agencyUser.configPreference(companyId, obj);
        msgbox.alert("配置成功");
    }
    $scope.cancel = async function(){
        $scope.hotel = '';
        $scope.traffic = '';
        $scope.abroadHotel = '';
        $scope.abroadTraffic = '';
    }

}