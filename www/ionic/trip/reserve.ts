import { ETripType, TripDetail, EPlanStatus } from 'api/_types/tripPlan';
import { Staff } from 'api/_types/staff/staff';
import { ESupplierType } from 'api/_types/company/supplier';

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
        $scope.compnySuppliers = compnySuppliers;
        canImportSuppliers  = suppliers.filter((item: any)=>{
            return item.type == ESupplierType.SYSTEM_CAN_IMPORT;
        })
        $scope.canImportSuppliers = canImportSuppliers;
        canNotImportSuppliers  = suppliers.filter((item: any)=>{
            return item.type == ESupplierType.SYSTEM_CAN_NOT_IMPORT;
        })
        $scope.canNotImportSuppliers = canNotImportSuppliers;
    }else{
        compnySuppliers = await currentCompany.getCompanySuppliers();
        $scope.compnySuppliers = compnySuppliers;
        //公共的供应商
        canImportSuppliers = await Models.supplier.find({where:{companyId: null, type: ESupplierType.SYSTEM_CAN_IMPORT}});
        canNotImportSuppliers = await Models.supplier.find({where:{companyId: null, type: ESupplierType.SYSTEM_CAN_NOT_IMPORT}});
        $scope.canImportSuppliers = canImportSuppliers;
        $scope.canNotImportSuppliers = canNotImportSuppliers;
    }
    if(!currentCompany.isAppointSupplier && compnySuppliers.length == 0 && canImportSuppliers.length == 0 && canNotImportSuppliers.length == 0){
        //特殊情况 企业显示推荐服务商关闭 且个供应商列表开关均关闭 显示推荐的不支持导入列表
        canNotImportSuppliers = await Models.supplier.find({where: {companyId: null, type: ESupplierType.SYSTEM_CAN_NOT_IMPORT}});
    }
    $scope.redirect = function(supplier){
        window.location.href="#/trip/reserve-redirect?detailId="+$stateParams.detailId+"&supplier="+supplier;
    }
}

export async function ReserveRedirectController($scope, Models, $stateParams, $interval, $timeout, City){
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
            $scope.reserveType = 'travel'
            break;
        case ETripType.HOTEL:
            $scope.reserveType = 'hotel'
            break;
        case ETripType.SPECIAL_APPROVE:
            break;
    }
    //供应商的logo
    /*switch($stateParams.supplier){
        case 'ctrip_business':
            $scope.ctrip_business = true;
            reDirectUrl = '//ct.ctrip.com/';
            break;
        case 'ctrip':
            $scope.ctrip = true;
            reDirectUrl = '//accounts.ctrip.com/member/login.aspx?BackUrl=http%3A%2F%2Fwww.ctrip.com%2F&responsemethod=get';
            break;
        case 'qunar':
            $scope.qunar = true;
            reDirectUrl = '//user.qunar.com/passport/login.jsp';
            break;
        case 'tong_cheng':
            $scope.tong_cheng = true;
            reDirectUrl = '//passport.ly.com/?pageurl=http%3A%2F%2Fwww.ly.com%2F';
            break;
        case 'air_china':
            $scope.air_china = true;
            break;
    }*/


    //下面三个小圆点的轮播
    $scope.load_one = true;
    $scope.load_two = false;
    $scope.load_third = false;
    $interval(function(){
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

    $timeout(function(){
        if($scope.reserveType == "travel"){
            window.location.href = supplier.trafficBookLink;
        }else if($scope.reserveType == "hotel"){
            window.location.href = supplier.hotelBookLink;
        }
    },5000)
}