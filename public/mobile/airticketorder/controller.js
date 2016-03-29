/**
 * Created by ZLW on 2016/03/24.
 */
'use strict';
var airTicket = (function () {

    API.require('tripPlan');
    API.require('auth');
    API.require('attachment');
    API.require('staff');
    API.require('travelBudget');

    var airTicket = {};

    /*
     机票订单详情页
     * @param $scope
     * @constructor
     */
    airTicket.OrderDetailsController = function ($scope, $routeParams) {
        loading(true);

        //settings
        $scope.deliveryAddressShown = false;

        $scope.toggle = function( params ){
            if( params==="deliveryAddress" ){
                $scope.deliveryAddressShown = ($scope.deliveryAddressShown?false:true);
            };
        }

    }

    airTicket.PassengerInfoController = function ($scope, $routeParams) {
        loading(true);
    }

    return airTicket;
})();

module.exports = airTicket;