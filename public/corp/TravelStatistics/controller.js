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
        $(".left_nav li").removeClass("on").eq(1).addClass("on");
        initPageData();

        function initPageData() {
            API.onload(function(){
                var monthStart = moment().startOf('Month').format('YYYY-MM-DD 00:00:00');
                var monthEnd = moment().endOf('Month').format('YYYY-MM-DD 23:59:59');
                var YMcommon = moment().startOf('Month').format('YYYY-MM')
                $scope.ymcommon = moment().startOf('Month').format('YYYY年MM月');
                console.info(YMcommon+'-10 00:00:00')
                Q.all([
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: monthStart, endTime: monthEnd}),
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: YMcommon+'-1 00:00:00', endTime: YMcommon+'-10 23:59:59'}),
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: YMcommon+'-11 00:00:00', endTime: YMcommon+'-20 23:59:59'}),
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: YMcommon+'-21 00:00:00', endTime: monthEnd})
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

    /*员工积分页面*/
    TravelStatistics.StaffPointController = function($scope) {
        $("title").html("员工积分");
        $(".left_nav li").removeClass("on").eq(1).addClass("on");

        API.onload(function(){
            API.staff.getCurrentStaff()//获取当前登录人员的企业id
                .then(function(staff){
                    console.info(staff);
                    var companyId = staff.companyId;
                    var staffId = staff.id;
                    console.info(companyId);
                    return Q.all([
                            API.staff.statStaffPointsByCompany({}), //企业积分统计，总积分，可用积分。
                            API.staff.getStaffPointsChangeByMonth({})//企业统计员工所有变动记录
                            ])
                            .spread(function(point,piontschange){
                                console.info(point);
                                $scope.allPoints = point.totalPoints;
                                $scope.remianPoints = point.balancePoints;

                                console.info(piontschange);
                                $scope.points = piontschange;

                                $scope.$apply();
                            })
                            .catch(function(err) {
                                console.info(err);
                            })
                            .done();
                })
        })
    }
    /*出差记录页面*/
    TravelStatistics.PlanListController = function($scope) {
        alert("zzzz");
    }
    return TravelStatistics;
})();

module.exports = TravelStatistics;