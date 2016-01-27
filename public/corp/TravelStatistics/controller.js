/**
 * Created by yumiao on 2016/01/26.
 */
'use strict';

var TravelStatistics = (function(){

    API.require('tripPlan');
    API.require("staff");

    var  TravelStatistics = {};

    /**
     * 结算信息页面Controller
     * @param $scope
     * @constructor
     */
    TravelStatistics.SettlementInfoController = function($scope) {
        $("title").html("结算信息");
        $(".left_nav li").removeClass("on").eq(2).addClass("on");
        initPageData();

        function initPageData() {
            API.onload(function(){
                Q.all([
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: '2016-01-01 00:00:00', endTime: '2016-01-31 23:59:59'}),
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: '2016-01-10 00:00:00', endTime: '2016-01-09 23:59:59'}),
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: '2016-01-20 00:00:00', endTime: '2016-01-19 23:59:59'}),
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: '2016-01-30 00:00:00', endTime: '2016-01-31 23:59:59'})
                ])
                    .spread(function(stat, s, z, x) {
                        $scope.stat = stat;
                        $scope.s = s; //上旬
                        $scope.z = z; //中旬
                        $scope.x = x; //下旬
                        console.info(stat);
                        $scope.$apply();
                    })
                    .catch(function(err) {
                        console.info(err);
                    })
                    .done();
            })
        }
    }

    return TravelStatistics;
})();

module.exports = TravelStatistics;