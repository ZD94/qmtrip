/**
 * Created by chen on 2016/1/15.
 */
'use strict';
var StaffAwardPlan=(function(){
    API.require("staff");

    var StaffAwardPlan = {};

    //员工奖励计划
    StaffAwardPlan.StaffAwardPlanController = function($scope) {
        $("title").html("员工奖励计划");
        $(".left_nav li").removeClass("on").eq(4).addClass("on");
        API.onload(function(){
            API.staff.statStaffPoints({})
                .then(function(point){
                    console.info(point);
                    $scope.point = point;
                })
                .catch(function(err){
                    TLDAlert(err.msg || err);
                })
        })
    }

    return StaffAwardPlan;
})();
module.exports = StaffAwardPlan;