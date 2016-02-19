/**
 * Created by chenhao on 2015/12/22.
 */
 function dataloading(isDone){
 	if (isDone) {
        setTimeout(function () {
            $("#loading").hide();
        }, 50)
    } else {
        $("#loading").show();
    }
 }
var StaffFirst = (function(){
	API.require("company");
	API.require("staff");
	API.require("tripPlan");
	API.require("travelPolicy");
	var StaffFirst ={};
	StaffFirst.StaffUserController = function($scope){
		dataloading(false);
		loading(true);
		$("title").html("首页");
		$(".staff_menu_t ul li").removeClass("on");
		$(".staff_menu_t ul a").eq(0).find("li").addClass("on");
		//企业管理首页信息
		$scope.initStaffUser = function(){
			// loading(true)
			API.onload(function(){
				API.staff.getCurrentStaff()
					.then(function(ret){
						var company_id = ret.companyId;
						var travelLevel =ret.travelLevel;
						var str = ret.name;
						$scope.firstname=str.substring(str.length-2,str.length);
						Q.all([
							API.tripPlan.countTripPlanNum({accountId:ret.id}),
							API.travelPolicy.getTravelPolicy({id: travelLevel})
						])
						.spread(function(tripPlanOrders,travelPolicy){
							$scope.businesstimes = tripPlanOrders;
							$scope.travelpolicy = travelPolicy;
							dataloading(true);
							$scope.$apply();
						})
						.catch(function(err){
							TLDAlert(err.msg || err)
						})
						$scope.$apply();
					})
					.catch(function(err){
						TLDAlert(err.msg || err)
					})
			})
		}
		$scope.initStaffUser();
	}

	return StaffFirst;
})();
module.exports = StaffFirst;