/**
 * Created by chenhao on 2015/12/22.
 */
var StaffFirst = (function(){
	API.require("company");
	API.require("staff");
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
						console.info(ret)
						// Q.all([
						// 	API.company.getCompanyFundsAccount(company_id),
						// 	API.staff.statisticStaffs({companyId:company_id})
						// ])
						// 	.spread(function(resutlt,num){
						// 		$scope.funds = resutlt.fundsAccount;
						// 		$scope.num = num.sta;
						// 		console.info(resutlt)
						// 		$scope.$apply();
						// 	})
						// 	.catch(function(err){
						// 		console.info(err)
						// 	})
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