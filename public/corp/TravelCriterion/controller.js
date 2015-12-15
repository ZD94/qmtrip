/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var TravelCriterion=(function(){


    var  TravelCriterion = {};

    /*
        差旅标准列表
     * @param $scope
     * @constructor
     */
    TravelCriterion.CriterionListController = function($scope, $routeParams) {
        $("title").html("差旅标准");
    }

    return TravelCriterion;
})();

module.exports = TravelCriterion;