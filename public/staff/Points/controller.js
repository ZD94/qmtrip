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
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(2).find("li").addClass("on");
        loading(true);
    }
    return point;
})();
module.exports = point;