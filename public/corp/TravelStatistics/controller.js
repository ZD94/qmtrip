/**
 * Created by yumiao on 2016/01/26.
 */
'use strict';

var TravelStatistics = (function(){
    var moment = require('moment');

    API.require('tripPlan');
    API.require("staff");
    API.require("agency");
    API.require("travelPolicy");

    var  TravelStatistics = {};

    /**
     * 结算信息页面Controller
     * @param $scope
     * @constructor
     */
    TravelStatistics.SettlementInfoController = function($scope) {
        $("title").html("结算信息");
        $(".left_nav li").removeClass("on").eq(1).addClass("on");
        var monthStart = moment().startOf('Month').format('YYYY-MM-DD 00:00:00');
        var monthEnd = moment().endOf('Month').format('YYYY-MM-DD 23:59:59');
        var YMcommon = moment().startOf('Month').format('YYYY-MM')
        $scope.ymcommon = moment().startOf('Month').format('YYYY年MM月');
        var date_array = new Array;
        
        $scope.initchart = function($event){
            console.info($($event.target).attr("data-zrep"));
            var startAT = $($event.target).attr("data-zrep");
            $scope.startAT = moment(startAT).startOf('month').format('YYYY-MM-DD');
            $scope.endAT = moment(startAT).endOf('month').format('YYYY-MM-DD 23:59:59');
            Promise.all([API.tripPlan.statBudgetByMonth({startTime:$scope.startAT, endTime:$scope.endAT}),
                API.tripPlan.statPlanOrderMoneyByCompany({startTime: $scope.startAT || monthStart, endTime: $scope.endAT || monthEnd})
                ])
                .spread(function(budget,stat){
                    console.info(stat);
                    console.info("%%%%%");
                    var s = budget[0];
                    var z = budget[1];
                    var x = budget[2];
                    $scope.stat = stat;
                    chartload(s,z,x);
                })
                .catch(function(err){
                    TLDAlert("数据加载失败,请稍后重试");
                })
        }
        function chartload(s,z,x) {
            $scope.s = s; //上旬
            $scope.z = z; //中旬
            $scope.x = x; //下旬
            $scope.s_month = moment(s.month).startOf('month').format('YYYY年MM月');
            $scope.z_month = moment(z.month).startOf('month').format('YYYY年MM月');
            $scope.x_month = moment(x.month).startOf('month').format('YYYY年MM月');
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
            console.info(s,z,x);
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
        }
        // API.tripPlan.statBudgetByMonth({startTime:$scope.startAT+'-01'||monthStart, endTime:$scope.endAT || monthEnd})
        initPageData();
        function initPageData() {
            API.onload(function(){
                API.staff.getCurrentStaff()
                    .then(function(staff){
                        console.info($scope.startAT,$scope.endAT)
                        return Promise.all([
                            API.company.getCompanyById(staff.companyId),
                            API.tripPlan.statPlanOrderMoneyByCompany({startTime: monthStart, endTime: monthEnd}),
                            API.tripPlan.statBudgetByMonth({startTime:$scope.startAT || monthStart, endTime:$scope.endAT || monthEnd})
                            ])
                    })
                    .spread(function(company,stat,budget){
                        var s = budget[0];
                        var z = budget[1];
                        var x = budget[2];
                        console.info(budget)
                        var current = moment().startOf('month');
                        var createAt = moment(company.createAt).startOf('month');
                        for(var cur = current;!cur.isBefore(createAt);cur.subtract(1, 'month')){
                            var _item = {cur_cn: cur.format('YYYY年MM月'), cur_en: cur.format('YYYY-MM')}
                            date_array.push(_item);
                        }
                        $scope.items=date_array;
                        chartload(s,z,x);
                        $scope.stat = stat;
                        Myselect ();
                    })
                    .catch(function(err){
                        TLDAlert("数据加载失败,请稍后重试");
                        console.info(err);
                    })
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
                    return Promise.all([
                            API.staff.statStaffPoints({}), //企业积分统计，总积分，可用积分。
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
                            })
                            .catch(function(err) {
                                TLDAlert(err.msg || err);
                            })
                            .done();
                })
        })
    }
    /*出差记录页面*/
    /**
    status:

    -1 审核未通过
    0 已提交 待审核
    1 已完成

    */
    TravelStatistics.PlanListController = function($scope) {
        // alert("zzzz");
        $("title").html("出差记录");
        $(".left_nav li").removeClass("on").eq(1).addClass("on");
        var initPlanlist = $scope.initPlanlist = function() {
            API.onload(function(){
                var params = {page:$scope.page||1,perPage:20};
                if ($scope.purposename != '' && $scope.purposename != undefined) {
                    params.description = {$like: '%'+ $scope.purposename + '%'};
                }
                if ($scope.emailOrName != '' && $scope.emailOrName != undefined) {
                    params.emailOrName = $scope.emailOrName;
                }
                if($scope.start_time) {
                    params.startTime = $scope.start_time;
                }

                if($scope.end_time) {
                    params.endTime = $scope.end_time;
                }
                console.info(params);
                API.tripPlan.pageTripPlansByCompany(params)
                    .then(function(list){
                        $scope.planlist = list.items;
                        if($scope.planlist.length == 0){
                            $("#pagination").hide();
                        }
                        console.log( $scope.planlist );
                        var planlist = list.items;
                        $scope.total = list.total;
                        $scope.pages = list.pages;
                        planlist = planlist.map(function(plan){
                            return API.staff.getStaff({id:plan.accountId})
                                .then(function(staff){
                                    plan.staffName = staff.staff.name;
                                    return plan;
                                })
                                .catch(function(err){
                                    TLDAlert(err.msg || err);
                                })
                        })

                        Promise.all(planlist)
                            .then(function(ret){
                                $scope.planlist = ret;
                                ret.map(function(s){
                                    var desc = s.description;
                                    var dest =s.arrivalCity;
                                    var startP = s.deptCity;
                                    if(desc && desc.length>5){
                                        s.description= desc.substr(0,5) + '…';
                                    }
                                    if(dest && dest.length>5){
                                        s.arrivalCity= dest.substr(0,5) + '…';
                                    }
                                    if(startP && startP.length>5){
                                        s.deptCity= startP.substr(0,5) + '…';
                                    }
                                    if(s.hotel.length>0){
                                        var hotelName = s.hotel[0].hotelName;
                                        var city = s.hotel[0].city;
                                        if (hotelName && hotelName.length > 5) {
                                            s.hotel[0].hotelName = hotelName.substr(0, 5) + '…';
                                        }
                                        if(city.length >5){
                                            s.hotel[0].city = city.substr(0, 5) + '…';
                                        }
                                    }

                                    if(s.backTraffic.length>0){
                                        var deptCity = s.backTraffic[0].deptCity;
                                        var arrivalCity = s.backTraffic[0].arrivalCity;
                                        if (deptCity && deptCity.length > 5) {
                                            s.backTraffic[0].deptCity = deptCity.substr(0, 5) + '…';
                                        };
                                        if (arrivalCity && arrivalCity.length > 5) {
                                            s.backTraffic[0].arrivalCity = arrivalCity.substr(0, 5) + '…';
                                        };
                                    }
                                    if(s.outTraffic.length>0){
                                        var deptCity = s.outTraffic[0].deptCity;
                                        var arrivalCity = s.outTraffic[0].arrivalCity;
                                        if (deptCity && deptCity.length > 5) {
                                            s.outTraffic[0].deptCity = deptCity.substr(0, 5) + '…';
                                        };
                                        if (arrivalCity && arrivalCity.length > 5) {
                                            s.outTraffic[0].arrivalCity = arrivalCity.substr(0, 5) + '…';
                                        };
                                    }
                                    return s;
                                })
                            })
                            .catch(function(err){
                                TLDAlert(err.msg || err)
                            })
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err)
                    })
            })
        }
        initPlanlist();
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
                        initPlanlist();
                    }
                });
                clearInterval (pagenum);
            }
        }
        var pagenum =setInterval($scope.pagination,1000);

        //进入详情页
        $scope.enterDetail = function (orderId) {
            window.open("#/TravelStatistics/planDetail?orderId=" + orderId);
        }
        //搜索
        $scope.searchPurposeName = function () {
            API.onload(function() {
                API.tripPlan.getProjectsList({project_name: $scope.purposename})
                    .then(function(result) {
                        $scope.PurposeNameitems = result;
                        if ($scope.PurposeNameitems) {
                            $(".PurposeNamelist").show();
                        }
                        console.info (result);
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.choosepPurposeName = function (project_name) {
            $scope.purposename = project_name;
            $(".PurposeNamelist").hide();
        }
        $(".purposename").blur(function(){
            setTimeout('$(".PurposeNamelist").hide()', 500);
        })
        $scope.searchKeyword = function () {
            if ($scope.keyword != '' && $scope.keyword != undefined) {
                setTimeout($scope.pagination1,100);
            }
            initPlanlist();
            pagenum =setInterval($scope.pagination,1000);
        }
    }
    // 出差记录详情页
    TravelStatistics.PlanDetailController = function($scope,$stateParams, $location, $loading, $anchorScroll) {
        $("title").html("出差记录");
        $(".left_nav li").removeClass("on").eq(1).addClass("on");
        var tripPlanId = $stateParams.orderId;
        $loading.start();
        API.onload(function(){
            API.tripPlan.getTripPlanById({id: tripPlanId})
                .then(function(result){
                    if(result.description && result.description.length>15){
                        result.description = result.description.substr(0,15);
                    }
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
                        if(!outTraffics.auditUser) {
                            API.tripPlan.getConsumeInvoiceImg({consumeId: outTraffics.id})
                                .then(function(invoiceImg){
                                    outTraffics.invoiceImg = invoiceImg;
                                    return outTraffics;
                                })
                        }else{
                            return Promise.all([
                                API.agency.getAgencyUserByCompany({agencyUserId: outTraffic.auditUser}),
                                API.tripPlan.getConsumeInvoiceImg({consumeId: outTraffic.id})
                            ])
                            .spread(function(auditName, invoiceImg) {
                                outTraffic.auditName = auditName.name;
                                outTraffic.invoiceImg = invoiceImg;
                                return outTraffic;
                            })
                        }
                    });

                    backTraffics.map(function(backTraffic){
                        if(!backTraffic.auditUser) {
                            API.tripPlan.getConsumeInvoiceImg({consumeId: backTraffic.id})
                                .then(function(invoiceImg){
                                    backTraffic.invoiceImg = invoiceImg;
                                    return backTraffic;
                                })
                        }else{
                            return Promise.all([
                                API.agency.getAgencyUserByCompany({agencyUserId: backTraffic.auditUser}),
                                API.tripPlan.getConsumeInvoiceImg({consumeId: backTraffic.id})
                            ])
                            .spread(function(auditName, invoiceImg) {
                                backTraffic.auditName = auditName.name;
                                backTraffic.invoiceImg = invoiceImg;
                                return backTraffic;
                            })
                        }
                    });

                    hotels = hotels.map(function(hotel){
                        if(!hotel.auditUser) {
                            API.tripPlan.getConsumeInvoiceImg({consumeId: hotel.id})
                                .then(function(invoiceImg){
                                    hotel.invoiceImg = invoiceImg;
                                    return hotel;
                                })
                        }else{
                            console.info(hotel.auditUser)
                            return Promise.all([
                                API.agency.getAgencyUserByCompany({agencyUserId: hotel.auditUser}),
                                API.tripPlan.getConsumeInvoiceImg({consumeId: hotel.id})
                            ])
                            .spread(function(auditName, invoiceImg) {
                                console.info(auditName)
                                hotel.auditName = auditName.name;
                                hotel.invoiceImg = invoiceImg;
                                return hotel;
                            })
                        }
                        
                    });
                    Promise.all(hotels)
                    .then(function(hotels) {
                        $scope.hotels = hotels;
                    })
                    .catch(function(err) {
                        TLDAlert(err.msg || err);
                    })

                    Promise.all(outTraffics)
                    .then(function(outTraffics) {
                        $scope.outTraffics = outTraffics;
                    })
                    .catch(function(err) {
                        TLDAlert(err.msg || err);
                    })

                    Promise.all(backTraffics)
                    .then(function(backTraffics) {
                        $scope.backTraffics = backTraffics;
                    })
                    .catch(function(err) {
                        TLDAlert(err.msg || err);
                    })
                    
                    API.staff.getStaff({id:$scope.planDetail.accountId})
                        .then(function(result){
                            $scope.travelerName = result.staff.name;
                            var travelLevel = result.staff.travelLevel;
                            return API.travelPolicy.getTravelPolicy({id: travelLevel});
                        })
                        .then(function(travelpolicy){
                            $scope.travelpolicy = travelpolicy;
                        })
                        .catch(function(err){
                            console.info(err);
                        })
                    $loading.end();
                    $(".title_top .standard").hover(function(){
                        $(this).siblings(".standard_detail").show();
                    },function(){
                        $(".standard_detail").hide();
                    })
                    console.info(result)
                })
                .catch(function(err){
                    TLDAlert(err.msg || err);
                    console.info(err)
                })
        })
        $scope.outTraffichref = function () {
            $location.hash('outTraffic');
            $anchorScroll();
        }
        $scope.hotelhref = function () {
            $location.hash('hotel');
            $anchorScroll();
        }
        $scope.backTraffichref = function () {
            $location.hash('backTraffic');
            $anchorScroll();
        }
        // //分页
        // $scope.pagination = function () {
        //     if ($scope.total) {
        //         $.jqPaginator('#pagination', {
        //             totalCounts: $scope.total,
        //             pageSize: 20,
        //             currentPage: 1,
        //             prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
        //             next: '<li class="next"><a href="javascript:;">下一页</a></li>',
        //             page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
        //             onPageChange: function (num) {
        //                 if ($scope.pages==1) {
        //                     $("#pagination").hide();
        //                 }
        //                 $scope.page = num;
        //                 $scope.initTravelList();
        //             }
        //         });
        //         clearInterval (pagenum);
        //     }
        // }
        // var pagenum =setInterval($scope.pagination,10);
    }
    //出差分布页面
    TravelStatistics.SettlemapController = function($scope) {
        $("title").html("出差分布");
        $(".left_nav li").removeClass("on").eq(1).addClass("on");
        API.onload(function(){
            for (var i = 1; i < 31; i++) {
                $(".set_map_date").append("<span>"+i+"</span>")
            }
        })
    }
    return TravelStatistics;
})();

module.exports = TravelStatistics;