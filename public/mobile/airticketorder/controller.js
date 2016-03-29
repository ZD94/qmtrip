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

    airTicket.InfoEditingController = function ($scope, $routeParams) {
        loading(true);
        
        $(document).ready(function(){
            $(".expireDate").mobiscroll().date({//.date() .time() .datetime()
                invalid: {
                    daysOfWeek: [],//[0,1,2,3,4,5]
                    daysOfMonth: []//['5/1', '12/24', '12/25']
                },
                theme: 'android-ics light',
                display: 'bottom',
                mode: 'scroller',
                dateOrder: 'yy mm dd',
                dateFormat: "yyyy-mm-dd",
                startYear: "2016",
                endYear: "2020",
                yearText: "年",
                monthText: "月",
                dayText: "日",
                showNow: false,
                nowText: "今天",
                setText: "完成",
                cancelText: "取消",
                rows: 5,
                showOnFocus: true
            })
        });

    }

    return airTicket;
})();

module.exports = airTicket;