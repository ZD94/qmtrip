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
						var company_id = ret.staff.companyId;
						var travelLevel =ret.staff.travelLevel;
						Q.all([
							API.tripPlan.listTripPlanOrderByCompany({status:0||1}),
							API.travelPolicy.getTravelPolicy(travelLevel)
						])
						.spread(function(tripplan,travel){
							$scope.businesstimes = tripplan.tripPlanOrders.length;
							$scope.travelpolicy = travel.travelPolicy;
							console.info(travel)
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