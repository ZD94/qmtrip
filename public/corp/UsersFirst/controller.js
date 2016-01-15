/**
 * Created by chenhao on 2015/12/18.
 */
var UsersFirst = (function(){
	API.require("company");
	API.require("staff");
	API.require("travelPolicy");
	API.require("tripPlan");
	var UsersFirst ={};
	UsersFirst.UserMainController = function($scope, $routeParams){
		$("title").html("差旅管理首页");
		$(".left_nav li").removeClass("on").eq(0).addClass("on");
		$scope.funds={};

		//判断是否第一次登录
		var logintime = $routeParams.logintime;
		if (logintime=='true') {
			$(".confirmFixed").show();
		}
		else {
			$(".confirmFixed").hide();
		}
		$scope.goPolicyList = function () {
			window.location.href = "#/TravelPolicy/PolicyList";
		}
		//关闭弹窗
		$scope.confirmClose = function () {
			$(".confirmFixed").hide();
		}


		//企业管理首页信息
		$scope.initCorpMain = function(){
			API.onload(function(){
				API.staff.getCurrentStaff()
					.then(function(staff){
						var company_id = staff.companyId;
						var travelLevel = staff.travelLevel;
						var start = moment().startOf('Month').format('YYYY-MM-DD 00:00:00');
						var end = moment().endOf('Month').format('YYYY-MM-DD 23:59:59');
						Q.all([
							API.company.getCompanyFundsAccount(company_id),
							API.staff.statisticStaffs({companyId:company_id}),
							API.travelPolicy.getLatestTravelPolicy({}),
							API.tripPlan.statPlanOrderMoneyByCompany({startTime:start,endTime:end}),
							API.staff.statStaffPointsByCompany({})
						])
							.spread(function(resutlt,num,travel_level,date,point){
								$scope.funds = resutlt;
								$scope.num = num;
								$scope.point = point;
								$scope.month = moment().startOf('Month').format('M');
								$scope.travelLevel = travel_level;
								if(date.planMoney>date.expenditure) {
									$scope.different =  "节省 "+Math.round((date.planMoney-date.expenditure)*100/date.planMoney)+"%";
								}
								else if(date.planMoney<date.expenditure){
									$scope.different =  "超出 "+Math.round((date.expenditure-date.planMoney)*100/date.expenditure)+"%";
								}
								else{
									$scope.different = "持平 0%"
								}
								$scope.initCharts(date.qmBudget,date.planMoney,date.expenditure);
								$scope.$apply();
							})
							.catch(function(err){
								console.info(err)
							})
						$scope.$apply();
					})
					.catch(function(err){
						console.info(err)
					})
			})
		}
		$scope.initCorpMain();
		$scope.initCharts = function(first,second,third){
			var myChart = window.echarts.init(document.getElementById('charts')); 
			var saving = (second-third).toFixed(2);
		    var option = {
				    tooltip: {
				        trigger: 'item'
				    },
				    toolbox: {
				        show: false,							//工具箱
				        feature: {
				            dataView: {show: true, readOnly: false},
				            restore: {show: true},
				            saveAsImage: {show: true}
				        }
				    },
				    calculable: false,							//禁止拖拽
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
				            show: true,							//x轴是否显示
				            axisLine : {						//轴线
				            	lineStyle:{
				            		color:'#ededed',
				            		type:'solid',
				            		width:4
				            	}
				            },
				            axisTick:{							//轴标记
				            	show:false
				            },
				            axisLabel:{	
				            	textStyle:{
				            		fontSize:14
				            	}
				            },
				            splitLine: {show:false},			//分隔线
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
				            type: 'bar',
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
				            		// 	{name:"first",xAxis:'计划支出',yAxis: 20,type:"max"},
				            		// 	{name:"second",xAxis:'实际支出',yAxis: 20,type:"min"}
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
				            		// 	{type:'max',name:'first'},
				            		// 	{type:'min',name:"two"}
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
		$scope.withoutcharge = function(){
            $(".ToCharge_box").css({'margin-left':-250,'margin-top':-154});
			$(".wayToCharge").show();
		}
		$scope.closeToCharge = function(){
			$(".wayToCharge").hide();
		}
	}

	return UsersFirst;
})();
module.exports = UsersFirst;