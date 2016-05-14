/**
 * Created by qp on 2016/1/11.
 */
'use strict';
var point=(function(){
    var moment = require('moment');
    API.require("staff");
    API.require("tripPlan");

    var point = {};

    //我的积分页面
    point.MyPointsController = function($scope) {
        // alert(222222);
        $scope.initMyPoint = function(){
            API.onload(function(){
                API.staff.getCurrentStaff()
                    .then(function (staff) {
                        var staffId = staff.id;
                        $scope.balancePoints = staff.balancePoints;
                        // var points = staff.balancePoints;
                        // points = points.replace(/([0-9])(?=(\d{3})+$)/g,'$1,');
                        // var params = {staffId:staffId,page:$scope.pageAllPoint}
                        Promise.all([
                            API.staff.listAndPaginatePointChange({staffId:staffId,options: {page:$scope.pageAllPoint}}),
                            API.staff.getStaffPointsChange({staffId:staffId})
                            ])
                            .spread(function(record,changes){
                                console.info(changes);
                                $scope.changes = changes;
                                record.items.map(function(c){
                                    var orderId = c.orderId;
                                    API.tripPlan.getTripPlanById({id: orderId})
                                        .then(function(order){
                                            c.orderCreateAt = moment(order.createAt).format('YYYY-MM-DD');
                                        })
                                    
                                })
                                // console.info($scope.record);
                                $scope.record = record.items;
                                $scope.totalAll = record.total;
                            })
                    })
                    .catch(function (err) {
                        TLDAlert(err.msg || err)
                    });
            })
        }
        $scope.initMyPoint();
        //进入详情页
        $scope.enterDetail = function (id) {
            window.location.href = "#/travelPlan/PlanDetail?tripPlanId="+id;
        }
        $scope.incomePoint = function(){
            API.onload(function(){
                API.staff.getCurrentStaff()
                    .then(function(staff){
                        var staffId = staff.id;
                        API.staff.listAndPaginatePointChange({staffId:staffId,status:1,options: {page:$scope.pageIncomePoint}})
                            .then(function(record){
                                record.items.map(function(c){
                                    var orderId = c.orderId;
                                    API.tripPlan.getTripPlanById({id: orderId})
                                        .then(function(order){
                                            c.orderCreateAt = moment(order.createAt).format('YYYY-MM-DD');
                                        })
                                })
                                $scope.incomerecord = record.items;
                                $scope.totalIncome = record.total;
                            })
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    })
            })
        }
        $scope.incomePoint();
        $scope.payPoint = function(){
            API.onload(function(){
                API.staff.getCurrentStaff()
                    .then(function(staff){
                        var staffId = staff.id;
                        API.staff.listAndPaginatePointChange({staffId:staffId,status:-1,options: {page:$scope.pagePayPoint}})
                            .then(function(record){
                                record.items.map(function(c){
                                    var orderId = c.orderId;
                                    API.tripPlan.getTripPlanById({id: orderId})
                                        .then(function(order){
                                            c.orderCreateAt = moment(order.createAt).format('YYYY-MM-DD');
                                        })
                                    
                                })
                                $scope.payrecord = record.items;
                                $scope.totalPay = record.total;
                            })
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    })
            })
        }
        $scope.payPoint();
        //全部分页
        $scope.paginationAll = function () {
            if ($scope.totalAll) {
                $.jqPaginator('#pagination1', {
                    totalCounts: $scope.totalAll,
                    pageSize: 6,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.pageAllPoint = num;
                        $scope.initMyPoint();
                    }
                });
                clearInterval(pagenum1);
            }
        }
        var pagenum1 =setInterval($scope.paginationAll,1);
        $scope.paginationIncome = function () {
            if ($scope.totalIncome) {
                $.jqPaginator('#pagination2', {
                    totalCounts: $scope.totalIncome,
                    pageSize: 6,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.pageIncomePoint = num;
                        $scope.incomePoint();
                    }
                });
                clearInterval(pagenum2);
            }
        }
        var pagenum2 =setInterval($scope.paginationIncome,1);
        $scope.paginationPay = function () {
            if ($scope.totalPay) {
                $.jqPaginator('#pagination3', {
                    totalCounts: $scope.totalPay,
                    pageSize: 6,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.pagePayPoint = num;
                        $scope.payPoint();
                    }
                });
                clearInterval(pagenum3);
            }
        }
        var pagenum3 =setInterval($scope.paginationPay,1);
        //积分变化图表
        $scope.initCharts = function(first,second,third){
            var myChart = window.echarts.init(document.getElementById('pointChart')); 
            var option = {
                    tooltip: {
                        trigger: 'item'
                    },
                    toolbox: {
                        show: false,                            //工具箱
                        feature: {
                            dataView: {show: true, readOnly: false},
                            restore: {show: true},
                            saveAsImage: {show: true}
                        }
                    },
                    calculable: false,                          //禁止拖拽
                    grid: {
                        borderWidth: 0,
                        borderColor:'#fff',
                        x:0,
                        y: 80,
                        y2: 30
                    },
                    xAxis: [
                        {
                            type: 'category',
                            show: true,                         //x轴是否显示
                            axisLine : {                        //轴线
                                lineStyle:{
                                    color:'#ededed',
                                    type:'solid',
                                    width:4
                                }
                            },
                            axisTick:{                          //轴标记
                                show:false
                            },
                            axisLabel:{ 
                                textStyle:{
                                    fontSize:14
                                }
                            },
                            splitLine: {show:false},            //分隔线
                            boundaryGap: true,
                            data: ['动态预算', '计划支出', '实际支出']
                        }
                    ],
                    yAxis: [
                        {
                            type: 'value',
                            show: false
                        }
                    ],
                    series: [
                        {
                            type: 'line',
                            itemStyle: {
                                normal: {
                                    color: function(params) {
                                        // build a color map as your need.
                                        var colorList = [
                                          '#00EACF','#FD6961','#8250FE'
                                        ];
                                        return colorList[params.dataIndex]
                                    },
                                    label: {
                                        show: true,
                                        position: 'top',
                                        formatter: '￥{c}'
                                    }
                                }
                            },
                            markLine:{
                                data: [
                                    // [
                                    //  {name:"first",xAxis:'计划支出',yAxis: 20,type:"max"},
                                    //  {name:"second",xAxis:'实际支出',yAxis: 20,type:"min"}
                                    // ]##01BDFF
                                    [
                                        {name:"节省",value:saving,xAxis:1,yAxis: second,
                                            itemStyle:{
                                                normal:{
                                                        color:'#01BDFF',
                                                        label:{
                                                            show:false
                                                        }
                                                    }
                                                }
                                            },
                                        {xAxis:2,yAxis: third}
                                    ]
                                    // [
                                    //  {type:'max',name:'first'},
                                    //  {type:'min',name:"two"}
                                    // ]
                                ]
                            },
                            data: [first,second,third]
                        }
                    ]
                };
            // 为echarts对象加载数据 
            myChart.setOption(option); 
        }
        //选项卡切换
        $(".pointRecord ul li a").click(function(){
            $(".pointRecord ul li").removeClass("on");
            $(this).closest("li").addClass("on");
            var index = $(this).closest("li").index();
            $(".recordList").hide();
            $(".recordList").eq(index).show();
           }) 
    }

    point.ExchangePointsController = function($scope) {
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(2).find("li").addClass("on");
    }
    return point;
})();
module.exports = point;