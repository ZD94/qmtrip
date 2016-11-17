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

export async function ReserveRedirectController($scope, Models, $stateParams, $interval, $timeout, City){
    require('./reserve.scss');

    var budget = await Models.tripDetail.get($stateParams.detailId);
    let tripPlanId = budget.tripPlanId;
    let tripPlan = await Models.tripPlan.get(tripPlanId);
    let getOddBudget = await tripPlan.getOddBudget();
    $scope.getOddBudget = getOddBudget;
    var supplier = await Models.supplier.get($stateParams.supplier);
    $scope.supplier = supplier;

    // console.info({fromCityName: budget.deptCity, toCityName: budget.arrivalCity, leaveDate: moment(budget.deptDateTime).format('YYYY-MM-DD') });
    // var airTicketLink = await supplier.getAirTicketReserveLink({fromCityName: budget.deptCity, toCityName: budget.arrivalCity, leaveDate: moment(budget.deptDateTime).format('YYYY-MM-DD') });
    // console.info(airTicketLink);
    // console.info("airTicketLink========");
    //
    // var hotelLink = await supplier.getHotelReserveLink({cityName: budget.arrivalCity});
    // console.info(hotelLink);
    // console.info("hotelLink==========");

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

    //判断是否是携程
    if(supplier.name == '携程旅行' && $scope.reserveType == "travel"){
        console.log('opopopopopopop');
        console.info({fromCityName: budget.deptCity, toCityName: budget.arrivalCity, leaveDate: moment(budget.deptDateTime).format('YYYY-MM-DD') })
        supplier.trafficBookLink = await supplier.getAirTicketReserveLink({fromCityName: budget.deptCity, toCityName: budget.arrivalCity, leaveDate: moment(budget.deptDateTime).format('YYYY-MM-DD') });
        console.log(supplier.trafficBookLink)
    }
    console.log({cityName: budget.city});
    if(supplier.name == '携程旅行' && $scope.reserveType == "hotel"){
        supplier.hotelBookLink = await supplier.getHotelReserveLink({cityName: budget.city});
    }
    console.log(supplier.hotelBookLink);

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
    if(window.cordova){
        console.log(cordova);

    }


    let timeout = $timeout(function(){



        if($scope.reserveType == "travel"){
            //window.open(supplier.trafficBookLink, '_self');
            //console.log("enter");
            if(window.cordova){
                //let ctripCss = require('./ctrip.scss').tag;
                //let ctripJs = 'console.log(window)';
                //console.log(ctripJs);
                let ref = window.cordova['InAppBrowser'].open(supplier.trafficBookLink,'_blank','location=yes');
                ref.addEventListener('loadstop', function(){
                    //ref.insertCSS({file: "ctrip.css"});
                    //http://m.ctrip.com/html5/ctrip.css
                    //ref.insertCSS({code: ctripCss.innerHTML});
                    //ref.executeScript({code: ctripJs});
                })
            }else{
                window.open(supplier.trafficBookLink, '_self');
            }
        }else if($scope.reserveType == "hotel"){
            if(window.cordova){
                let ref = window.cordova['InAppBrowser'].open(supplier.hotelBookLink,'_blank','location=yes');
            }else{
                window.open(supplier.hotelBookLink, '_self');
            }
        }

        if(angular.isDefined(interval)){
            $interval.cancel(interval);
            interval = undefined;
        }
    },5000)

    $scope.$on('$destroy', function(){
        $timeout.cancel(timeout);
        timeout = undefined;
    })
}