import { ETripType, TripDetail, EPlanStatus } from 'api/_types/tripPlan';
import { Staff } from 'api/_types/staff/staff';
import { ESupplierType } from 'api/_types/company/supplier';
import {TripDetailTraffic, TripDetailHotel} from "../../../api/_types/tripPlan/tripDetailInfo";


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
    if (budget.type == ETripType.BACK_TRIP || budget.type == ETripType.OUT_TRIP) {
        budget = <TripDetailTraffic>budget;
    }else if(budget.type == ETripType.HOTEL){
        budget = <TripDetailHotel>budget;
    }
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
            break;
        case ETripType.SPECIAL_APPROVE:
            break;
    }

    // let deptDateTime = moment(budget.deptDateTime).format('YYYY-MM-DD')
    // let bookLink = await supplier.getBookLink({reserveType: $scope.reserveType, fromCityName: $scope.deptCity, toCityName: $scope.arrivalCity, leaveDate: deptDateTime,cityName: budget.city});
    let bookLink = await budget.getBookLink({reserveType: $scope.reserveType, supplierId: supplier.id});
    console.log(bookLink);

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

    let timeout = $timeout(function(){
        //bookLink.url = 'http://ct.ctrip.com/m/';

        //酒店的部分
        //http://ct.ctrip.com/m/Book/Hotel
        //键名   DomesticHotel
        // let domesticHotel = {
        //     "HotelSearch":{
        //         "City":["6","大连","天津|4|dalian","0"],
        //         "CityType":"0","BType":"",
        //         "HotelDate":{"sDate":"2016-12-19","eDate":"2016-12-29"},
        //         "Htype":"M",
        //         "choice":"0"},
        //     "domesitcCityHistory":["南京|12|Xian"]
        // }
        // let domesticHotel_str = "'"+JSON.stringify(domesticHotel)+"'";
        // console.log(domesticHotel_str);


        //飞机的部分
        //http://ct.ctrip.com/m/Book/Flight
        //键名   DomesticFlights
        // let DomesticFlights = {
        //     "FlightSearch":
        //         {
        //             "depCity":["30","武汉","南京,XMN|25|Hangzhou","0","0"],
        //             "arrCity":["31","苏州","青岛,KMG|34|Xian","0","0"],
        //             "SType":"S",
        //             "cityType":0,
        //             "BType":"",
        //             "CabType":"",
        //             "FlightDate":{"sDate":"2016-12-5","eDate":"2016-12-23"}
        //         },
        //     "domesitcCityHistory":["西安,SIA|10|Xian","杭州,HGH|17|Hangzhou","青岛,TAO|7|Qingdao"],
        //     "internationalCityHistory":""
        // }
        // let DomesticFlights_str = "'"+JSON.stringify(DomesticFlights)+"'";


        //火车的部分
        //http://ct.ctrip.com/m/Book/Train
        //键名   Train
        // let train = {
        //     "TrainSearch":{
        //         "depCity":["lanzhou","兰州","兰州,|lanzhou|lanzhou"],
        //         "arrCity":["xian","西安","西安,|xian|xian"],
        //         "trainType":"",
        //         "TrainDate":{"sDate":"2016-12-7"}},
        //     "domesitcCityHistory":["武汉,|170|Wuhan","郑州,|198|Zhengzhou"]
        // };
        // let train_str = "'"+JSON.stringify(train)+"'";


        // bookLink.jsCode = `console.log("home");
        //                     if(window.location.href == "http://ct.ctrip.com/m/"){
        //                         var account = document.getElementById("account");
        //                         var password = document.getElementById("password");
        //                         console.log("account");
        //                         if(account&&password){
        //                             var jingliAccount = localStorage.getItem("jingliAccount");
        //                             var jingli = localStorage.getItem("jingli");
        //                             var login = document.getElementById("login")
        //                             if(jingliAccount&jingli){
        //                                 account.value = jingliAccount;
        //                                 password.value = jingli;
        //                                 login.click();
        //                             }else{
        //                                 login.addEventListener("click", function(){
        //                                     localStorage.setItem("jingliAccount", account.value);
        //                                     localStorage.setItem("jingli",password.value);
        //                                 })
        //                             }
        //                         }else{
        //                             console.log("huhu")
        //                             console.log(${train_str});
        //                             localStorage.setItem("Train", ${train_str});
        //
        //                             window.location.href = "http://ct.ctrip.com/m/Book/Train";
        //                         }
        //                     }
        //                     if(window.location.href == "http://ct.ctrip.com/m/Book/Train"){
        //                         console.log("success")
        //                         var search = document.getElementById("btn_search");
        //                         search.click();
        //                     }
        //                     `;


        inAppBrowser.open(bookLink.url, bookLink.jsCode);
    },3000)

    $scope.$on('$destroy', function(){
        $timeout.cancel(timeout);
        timeout = undefined;
        $interval.cancel(interval);
        interval = undefined;
    })
}