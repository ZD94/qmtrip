import { ETripType, TripDetail, EPlanStatus } from 'api/_types/tripPlan';
import { Staff } from 'api/_types/staff/staff';
import { ESupplierType } from 'api/_types/company/supplier';


let moment = require("moment");

export async function ReserveController($scope, Models, $stateParams){
    require('./reserve.scss');
    var compnySuppliers = [];
    var canImportSuppliers = [];
    var canNotImportSuppliers = [];
    var currentStaff = await Staff.getCurrent();
    var currentCompany = currentStaff.company;
    if(!currentCompany.isAppointSupplier){
        var suppliers = await currentCompany.getAppointedSuppliers();
        compnySuppliers  = suppliers.filter((item: any)=>{
            return item.companyId == currentCompany.id && item.type == ESupplierType.COMPANY_CUSTOM;
        })
        canImportSuppliers  = suppliers.filter((item: any)=>{
            return item.type == ESupplierType.SYSTEM_CAN_IMPORT;
        })
        canNotImportSuppliers  = suppliers.filter((item: any)=>{
            return item.type == ESupplierType.SYSTEM_CAN_NOT_IMPORT;
        })
    }else{
        compnySuppliers = await currentCompany.getCompanySuppliers({where: {isInUse: true, type: ESupplierType.COMPANY_CUSTOM}});
        //公共的供应商
        canImportSuppliers = await Models.supplier.find({where:{companyId: null, type: ESupplierType.SYSTEM_CAN_IMPORT}});
        canNotImportSuppliers = await Models.supplier.find({where:{companyId: null, type: ESupplierType.SYSTEM_CAN_NOT_IMPORT}});
    }
    if(!currentCompany.isAppointSupplier && compnySuppliers.length == 0 && canImportSuppliers.length == 0 && canNotImportSuppliers.length == 0){
        //特殊情况 企业显示推荐服务商关闭 且个供应商列表开关均关闭 显示推荐列表
        canImportSuppliers = await Models.supplier.find({where:{companyId: null, type: ESupplierType.SYSTEM_CAN_IMPORT}});
        canNotImportSuppliers = await Models.supplier.find({where: {companyId: null, type: ESupplierType.SYSTEM_CAN_NOT_IMPORT}});
    }
    $scope.compnySuppliers = compnySuppliers;
    $scope.canImportSuppliers = canImportSuppliers;
    $scope.canNotImportSuppliers = canNotImportSuppliers;

    $scope.redirect = function(supplier){
        window.location.href="#/trip/reserve-redirect?detailId="+$stateParams.detailId+"&supplier="+supplier;
    }
}

export async function ReserveRedirectController($scope, Models, $stateParams, $interval, $timeout, City, inAppBrowser){
    require('./reserve.scss');

    var budget = await Models.tripDetail.get($stateParams.detailId);
    let tripPlanId = budget.tripPlanId;
    let tripPlan = await Models.tripPlan.get(tripPlanId);
    let getOddBudget = await tripPlan.getOddBudget();
    $scope.getOddBudget = getOddBudget;
    var supplier = await Models.supplier.get($stateParams.supplier);
    $scope.supplier = supplier;


    API.require("place")
    await API.onload();
    let reDirectUrl = '#';



    $scope.budget = budget;
    switch(budget.type) {
        case ETripType.BACK_TRIP:
        case ETripType.OUT_TRIP:
            let deptCity = await City.getCity($scope.budget.deptCity);
            let arrivalCity = await City.getCity($scope.budget.arrivalCity);
            $scope.deptCity = deptCity.name;
            $scope.arrivalCity = arrivalCity.name;
            if(budget.invoiceType == 0){
                $scope.reserveType = 'travel_train'
            }else{
                $scope.reserveType = 'travel_plane'
            }
            break;
        case ETripType.HOTEL:
            $scope.reserveType = 'hotel';
            $scope.arrivalCity = budget.city;
            break;
        case ETripType.SPECIAL_APPROVE:
            break;
    }

    let linkJS: string = '';
    let bookLinkArr = await supplier.changeCtripBookLink($scope.reserveType, $scope.arrivalCity, $scope.deptCity, moment(budget.deptDateTime).format('YYYY-MM-DD'));
    console.log(bookLinkArr)

    //下面三个小圆点的轮播
    $scope.load_one = true;
    $scope.load_two = false;
    $scope.load_third = false;
    let interval = $interval(function(){
        if($scope.load_one){
            $scope.load_one = false;
            $scope.load_two = true;
        }else if($scope.load_two){
            $scope.load_two = false;
            $scope.load_third = true;
        }else {
            $scope.load_one = true;
            $scope.load_third = false;
        }
    },200)

    var url: string = '';
    if($scope.reserveType == "travel_train" || $scope.reserveType == "travel_plane"){
        url = supplier.trafficBookLink;
    }else{
        url = supplier.hotelBookLink;
    }
    if(bookLinkArr[0]){
        url = bookLinkArr[0];
        linkJS = bookLinkArr[1]
    }


    let timeout = $timeout(function(){
        inAppBrowser.open(url, linkJS);
    },3000)

    $scope.$on('$destroy', function(){
        $timeout.cancel(timeout);
        timeout = undefined;
        $interval.cancel(interval);
        interval = undefined;
    })
}