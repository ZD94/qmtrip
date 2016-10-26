export async function ReserveController($scope){
    require('./reserve.scss');
    $scope.redirect = function(){
        window.location.href="#/trip/reserve-redirect"
    }
}

export async function ReserveRedirectController($scope){
    require('./reserve.scss');
    // setTimeout(function(){
    //     window.location.href="http://ct.ctrip.com/";
    // },3000)
}