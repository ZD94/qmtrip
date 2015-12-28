/**
 * Created by chenhao on 2015/12/22.
 */
var StaffFirst = (function(){
	API.require("company");
	API.require("staff");
	API.require("tripPlan");
	API.require("travelPolicy");
	var StaffFirst ={};
	StaffFirst.StaffUserController = function($scope){
		$("title").html("首页");
		$(".left_nav li").removeClass("on").eq(0).addClass("on");
		//企业管理首页信息
		$scope.initStaffUser = function(){
			API.onload(function(){
				API.staff.getCurrentStaff()
					.then(function(ret){
						var company_id = ret.companyId;
						var travelLevel =ret.travelLevel;
						var str = ret.name;
						$scope.firstname=str.substring(0,2);
								console.info("*************************");
								API.tripPlan.listTripPlanOrderByCompany({$or: [{status: 0}, {status: 1}]}, function(err, ret){
										console.info(err);
										console.info(ret);
								})
						Q.all([
							API.tripPlan.listTripPlanOrderByCompany({$or: [{status: 0}, {status: 1}]}),
							API.travelPolicy.getTravelPolicy(travelLevel)
						])
						.spread(function(tripPlanOrders,travelPolicy){
							console.info(travelPolicy);
							$scope.businesstimes = tripPlanOrders.length;
							$scope.travelpolicy = travelPolicy;
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
		$scope.initStaffUser();
	}

	return StaffFirst;
})();
module.exports = StaffFirst;