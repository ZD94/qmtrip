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
    }

    point.ExchangePointsController = function($scope) {
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(2).find("li").addClass("on");
        loading(true);
    }
    return point;
})();
module.exports = point;