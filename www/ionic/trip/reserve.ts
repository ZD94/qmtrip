import { ETripType, TripDetail, EPlanStatus } from 'api/_types/tripPlan';

export async function ReserveController($scope, $stateParams){
    require('./reserve.scss');
    $scope.redirect = function(supplier){
        window.location.href="#/trip/reserve-redirect?detailId="+$stateParams.detailId+"&supplier="+supplier
    }
}

export async function ReserveRedirectController($scope, Models, $stateParams, $interval){
    require('./reserve.scss');

    var budget = await Models.tripDetail.get($stateParams.detailId);
    API.require("place")
    await API.onload();
    $scope.budget = budget;
    switch(budget.type) {
        case ETripType.BACK_TRIP:
        case ETripType.OUT_TRIP:
            let deptCity = await API.place.getCityInfo({cityCode: $scope.budget.deptCity});
            let arrivalCity = await API.place.getCityInfo({cityCode: $scope.budget.arrivalCity});
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
    switch($stateParams.supplier){
        case 'ctrip_business':
            $scope.ctrip_business = true;
            break;
        case 'ctrip':
            $scope.ctrip = true;
            break;
        case 'qunar':
            $scope.qunar = true;
            break;
        case 'tong_cheng':
            $scope.tong_cheng = true;
            break;
        case 'air_china':
            $scope.air_china = true;
            break;
    }


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
    // setTimeout(function(){
    //     window.location.href="http://ct.ctrip.com/";
    // },3000)
}