/**
 * Created by chenhao on 2015/12/18.
 */
var UsersFirst = (function(){
	API.require("company");
	API.require("staff");
	API.require("travelPolicy");
	API.require("tripPlan");
	var UsersFirst ={};
	UsersFirst.UserMainController = function($scope){
		$("title").html("差旅管理首页");
		$(".left_nav li").removeClass("on").eq(0).addClass("on");
		//企业管理首页信息
		$scope.initCorpMain = function(){
			API.onload(function(){
				API.staff.getCurrentStaff()
					.then(function(staff){
						var company_id = staff.companyId;
						var travelLevel = staff.travelLevel;
						var start = moment().startOf('Month').format('YYYY-MM-DD 00:00:00');
						var end = moment().endOf('Month').format('YYYY-MM-DD 23:59:59');
						console.info(start)
						console.info(end)
						Q.all([
							API.company.getCompanyFundsAccount(company_id),
							API.staff.statisticStaffs({companyId:company_id}),
							API.travelPolicy.getTravelPolicy({id: travelLevel}),
							API.tripPlan.statPlanOrderMoneyByCompany({startTime:start,endTime:end})
						])
							.spread(function(resutlt,num,travel_level,date){
								$scope.funds = resutlt;
								$scope.num = num;
								$scope.travelLevel = travel_level;
								console.info(date);
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
	}

	return UsersFirst;
})();
module.exports = UsersFirst;