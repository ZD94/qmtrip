/**
 * Created by chenhao on 2015/12/18.
 */
var UsersFirst = (function(){
	API.require("company");
	API.require("staff");
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
						Q.all([
							API.company.getCompanyFundsAccount(company_id),
							API.staff.statisticStaffs({companyId:company_id})
						])
							.spread(function(resutlt,num){
								$scope.funds = resutlt;
								$scope.num = num;
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