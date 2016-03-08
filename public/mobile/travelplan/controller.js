/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelplan=(function(){

    API.require('tripPlan');
    API.require("auth");
    API.require("attachment");

    var  travelplan = {};

    /*
        出差单列表
     * @param $scope
     * @constructor
     */
    travelplan.PlanlistController = function($scope) {
        $("title").html("出差记录");
        loading(true);
    }



    /*
     出差单详细
     * @param $scope
     * @constructor
     */
    travelplan.PlandetailController = function($scope, $routeParams) {
        $("title").html("出差记录");
        loading(true);
    }









    return travelplan;
})();

module.exports = travelplan;