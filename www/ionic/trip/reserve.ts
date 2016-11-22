import { ETripType, TripDetail, EPlanStatus } from 'api/_types/tripPlan';
import { Staff } from 'api/_types/staff/staff';
import { ESupplierType } from 'api/_types/company/supplier';
import * as path from 'path';

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
    if(supplier.name == '携程旅行'){
        if($scope.reserveType == "travel" && budget.invoiceType != 0){
            supplier.trafficBookLink = await supplier.getAirTicketReserveLink({fromCityName: budget.deptCity, toCityName: budget.arrivalCity, leaveDate: moment(budget.deptDateTime).format('YYYY-MM-DD') });
        }else if($scope.reserveType == "travel" && budget.invoiceType == 0){
            supplier.trafficBookLink = "http://m.ctrip.com/webapp/train/";
        }else if($scope.reserveType == "hotel"){
            supplier.hotelBookLink = await supplier.getHotelReserveLink({cityName: budget.city});
        }
    }


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

    let relpath = path.relative(window['bundle_url'], window['Manifest'].root);
    let ThemeableBrowserOption = {
        toolbar: {
            height: 44,
            color: '#f0f0f0ff'
        },
        title: {
            color: '#003264ff',
            staticText: '鲸力商旅',
        },
        backButton: {
            wwwImage: relpath+'/ionic/images/back.png',
            wwwImagePressed: relpath+'/ionic/images/back.png',
            wwwImageDensity: 2,
            align: 'left',
            event: 'backPressed'
        },
        closeButton: {
            wwwImage: relpath+'/ionic/images/close.png',
            wwwImagePressed: relpath+'/ionic/images/close.png',
            wwwImageDensity: 2,
            align: 'left',
            event: 'closePressed'
        },
        backButtonCanClose: true,
    }

    let timeout = $timeout(function(){



        if($scope.reserveType == "travel"){
            if(window.cordova){
                // let ctripJs = `window.onload = function(){
                //                var trains = document.getElementsByClassName('train-station')[0];
                //                var from = trains.getElementsByClassName('from')[0];
                //                var to = trains.getElementsByClassName('to')[0];
                //                from.innerHTML = 'hahhah';
                //                from.click();
                //                console.log(from);
                //                var search = document.getElementsByClassName('search_input')[0];
                //                console.log(search);
                //                search.value="tianjin"
                //                //$(search).trigger('input');
                //                }
                //                `;
                //console.log(ctripJs);
                let ref = cordova['ThemeableBrowser'].open(supplier.trafficBookLink,'_blank',ThemeableBrowserOption);
               // ref.addEventListener('loadstop', function(){
               //
               //      ref.executeScript({code: ctripJs});
               // })
            }else{
                window.open(supplier.trafficBookLink, '_self');
            }
        }else if($scope.reserveType == "hotel"){
            if(window.cordova){
                let ref = cordova['ThemeableBrowser'].open(supplier.hotelBookLink,'_blank',ThemeableBrowserOption);
            }else{
                window.open(supplier.hotelBookLink, '_self');
            }
        }

        if(angular.isDefined(interval)){
            $interval.cancel(interval);
            interval = undefined;
        }
    },3000)

    $scope.$on('$destroy', function(){
        $timeout.cancel(timeout);
        timeout = undefined;
    })
}