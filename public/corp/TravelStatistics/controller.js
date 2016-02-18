/**
 * Created by yumiao on 2016/01/26.
 */
'use strict';

var TravelStatistics = (function(){

    API.require('tripPlan');
    API.require("staff");
    API.require("agency");

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
                Q.all([
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: monthStart, endTime: monthEnd}),
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: YMcommon+'-1 00:00:00', endTime: YMcommon+'-10 23:59:59'}),
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: YMcommon+'-11 00:00:00', endTime: YMcommon+'-20 23:59:59'}),
                    API.tripPlan.statPlanOrderMoneyByCompany({startTime: YMcommon+'-21 00:00:00', endTime: monthEnd})
                ])
                    .spread(function(stat, s, z, x) {
                        var planConsume = [];
                        planConsume.push(s.planMoney);
                        planConsume.push(z.planMoney);
                        planConsume.push(x.planMoney);

                        var factConsume = [];
                        factConsume.push(s.expenditure);
                        factConsume.push(z.expenditure);
                        factConsume.push(x.expenditure);

                        var travelNumbers = [];
                        travelNumbers.push(s.NumOfStaff, z.NumOfStaff, x.NumOfStaff);

                        var myChart = echarts.init(document.getElementById('settle_chart'));
                        // 指定图表的配置项和数据
                        var option = {
                            tooltip: {},
                            legend: {
                                data:['计划支出', '实际支出', '出差人数']
                            },
                            color: ["#00eacf", "#fd6961", "#8250fe"],
                            xAxis: {
                                data: ['上旬', '中旬', '下旬']
                            },
                            yAxis: {},
                            series: [{
                                name: '计划支出',
                                type: 'bar',
                                data: planConsume
                            }, {
                                name: "实际支出",
                                type: "bar",
                                data: factConsume
                            }, {
                                name: "出差人数",
                                type: "line",
                                data: travelNumbers
                            }]
                        };

                        // 使用刚指定的配置项和数据显示图表。
                        myChart.setOption(option);

                        $scope.stat = stat;
                        $scope.s = s; //上旬
                        $scope.z = z; //中旬
                        $scope.x = x; //下旬
                        $scope.$apply();
                    })
                    .catch(function(err) {
                        TLDAlert("数据加载失败,请稍后重试");
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
                    var companyId = staff.companyId;
                    var staffId = staff.id;
                    return Q.all([
                            API.staff.statStaffPointsByCompany({}), //企业积分统计，总积分，可用积分。
                            API.staff.getStaffPointsChangeByMonth({})//企业统计员工所有变动记录
                            ])
                            .spread(function(point,statistic){
                                //对数据进行处理
                                var incomes = [];
                                var consumes = [];
                                var balances = [];
                                var incomeObj = {};
                                var consumeObj = {};
                                var balanceObj = {};
                                var months = [];
                                for(var i=0, ii=statistic.length; i<ii; i++) {
                                    months.push(statistic[i].month);
                                    incomeObj[statistic[i].month] = statistic[i].increase;
                                    consumeObj[statistic[i].month] = statistic[i].decrease;
                                    balanceObj[statistic[i].month] = statistic[i].balance;
                                    months.sort();
                                }
                                for(var i=0, ii=months.length; i<ii; i++) {
                                    incomes.push(incomeObj[months[i]]);
                                    consumes.push(consumeObj[months[i]]);
                                    balances.push(balanceObj[months[i]]);
                                }

                                var myChart = echarts.init(document.getElementById('settle_chart'));
                                // 指定图表的配置项和数据
                                var option = {
                                    tooltip: {},
                                    legend: {
                                        data:['新增积分', '兑换积分', '剩余积分']
                                    },
                                    color: ["#00eacf", "#fd6961", "#8250fe"],
                                    xAxis: {
                                        data: months
                                    },
                                    yAxis: {},
                                    series: [{
                                        name: '新增积分',
                                        type: 'bar',
                                        data: incomes
                                    }, {
                                        name: "兑换积分",
                                        type: "bar",
                                        data: consumes
                                    }, {
                                        name: "剩余积分",
                                        type: "line",
                                        data: balances
                                    }]
                                };

                                // 使用刚指定的配置项和数据显示图表。
                                myChart.setOption(option);

                                $scope.allPoints = point.totalPoints;
                                $scope.remianPoints = point.balancePoints;
                                $scope.points = statistic;
                                $scope.$apply();
                            })
                            .catch(function(err) {
                                TLDAlert(err.msg || err);
                            })
                            .done();
                })
        })
    }
    /*出差记录页面*/
    TravelStatistics.PlanListController = function($scope) {
        // alert("zzzz");
        $("title").html("员工积分");
        $(".left_nav li").removeClass("on").eq(1).addClass("on");
        API.onload(function(){
            var params = {page:$scope.page}
            API.tripPlan.pageTripPlanOrderByCompany(params)
                .then(function(list){
                    console.info(list);
                    // $scope.planlist = list.items;
                    var planlist = list.items;
                    planlist.map(function(plan){
                        Q.all([
                            API.tripPlan.getTripPlanOrderById(plan.id),
                            API.staff.getStaff({id:plan.accountId})
                        ])
                            .spread(function(order,staff){
                                // console.info(order);
                                // console.info(staff);
                                plan.staffName = staff.staff.name;
                                // console.info(plan);
                                $scope.planlist = planlist;
                                $scope.$apply();
                            })
                            .catch(function(err){
                                TLDAlert(err.msg || err);
                            })
                    })
                })
                .catch(function(err){
                    TLDAlert(err.msg || err)
                })
        })
        //进入详情页
        $scope.enterDetail = function (orderId) {
            window.location.href = "#/TravelStatistics/planDetail?orderId=" + orderId;
        }
    }
    // 出差记录详情页
    TravelStatistics.PlanDetailController = function($scope,$routeParams) {
        var planId = $routeParams.orderId;
        API.onload(function(){
            API.tripPlan.getTripPlanOrderById(planId)
                .then(function(result){
                    console.info(result);
                    $scope.planDetail = result;
                    $scope.backTraffic = $scope.planDetail.backTraffic[0];
                    $scope.hotel = $scope.planDetail.hotel[0];
                    $scope.outTraffic = $scope.planDetail.outTraffic[0];

                    var outTraffic = result.outTraffic[0];
                    var backTraffic = result.backTraffic[0];
                    var hotel = result.hotel[0];

                    var outTraffics = $scope.planDetail.outTraffic;
                    var backTraffics = $scope.planDetail.backTraffic;
                    var hotels = $scope.planDetail.hotel;

                    if (hotel && hotel.newInvoice) {
                        $scope.hotelInvoiceImg = "/consume/invoice/" + hotel.id;
                    }

                    if (backTraffic && backTraffic.newInvoice) {
                        $scope.backTrafficInvoiceImg = "/consume/invoice/" + backTraffic.id;
                    }

                    if (outTraffic && outTraffic.newInvoice) {
                        $scope.outTrafficInvoiceImg = "/consume/invoice/" + outTraffic.id;
                    }

                    outTraffics.map(function(outTraffic){
                        return Q.all([
                            API.agency.getAgencyUser(outTraffic.auditUser),
                            API.tripPlan.getConsumeInvoiceImg({consumeId: outTraffic.id})
                        ])
                        .spread(function(auditName, invoiceImg) {
                            outTraffic.auditName = auditName;
                            outTraffic.invoiceImg = invoiceImg;
                            return outTraffic;
                        })
                    });

                    backTraffics.map(function(backTraffic){
                        return Q.all([
                                API.agency.getAgencyUser(backTraffic.auditUser),
                                API.tripPlan.getConsumeInvoiceImg({consumeId: backTraffic.id})
                            ])
                            .spread(function(auditName, invoiceImg) {
                                backTraffic.auditName = auditName;
                                backTraffic.invoiceImg = invoiceImg;
                                return backTraffic;
                            })
                    });

                    hotels = hotels.map(function(hotel){
                        return Q.all([
                                API.agency.getAgencyUser(hotel.auditUser),
                                API.tripPlan.getConsumeInvoiceImg({consumeId: hotel.id})
                            ])
                            .spread(function(auditName, invoiceImg) {
                                hotel.auditName = auditName;
                                hotel.invoiceImg = invoiceImg;
                                return hotel;
                            })
                    });

                    Q.all(hotels)
                    .then(function(hotels) {
                        $scope.hotels = hotels;
                        $scope.$apply();
                    })
                    .catch(function(err) {
                        TLDAlert(err.msg || err);
                    })

                    Q.all(outTraffics)
                    .then(function(outTraffics) {
                        $scope.outTraffics = outTraffics;
                        $scope.$apply();
                    })
                    .catch(function(err) {
                        TLDAlert(err.msg || err);
                    })

                    Q.all(backTraffics)
                    .then(function(backTraffics) {
                        $scope.backTraffics = backTraffics;
                        $scope.$apply();
                    })
                    .catch(function(err) {
                        TLDAlert(err.msg || err);
                    })
                    API.staff.getStaff({id:$scope.planDetail.accountId})
                        .then(function(result){
                            $scope.travelerName = result.name;
                            $scope.$apply();
                        })
                    loading(true);
                    console.info(result);
                    $scope.$apply();
                })
                .catch(function(err){
                    TLDAlert(err.msg || err);
                })
        })

        //分页
        $scope.pagination = function () {
            if ($scope.total) {
                $.jqPaginator('#pagination', {
                    totalCounts: $scope.total,
                    pageSize: 20,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        if ($scope.pages==1) {
                            $("#pagination").hide();
                        }
                        $scope.page = num;
                        $scope.initTravelList();
                    }
                });
                clearInterval (pagenum);
            }
        }
        var pagenum =setInterval($scope.pagination,10);
    }
    return TravelStatistics;
})();

module.exports = TravelStatistics;