/**
 * Created by qp on 2016/1/11.
 */
'use strict';
var point=(function(){
    API.require("staff");

    var point = {};

    //我的积分页面
    point.MyPointsController = function($scope) {
        //alert(222222);
        loading(true);
    }

    point.ExchangePointsController = function($scope) {
        loading(true);
    }
    return point;
})();
module.exports = point;