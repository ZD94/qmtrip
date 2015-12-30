/**
 * Created by chenhao on 2015/12/29.
 */
module.exports = (function(){
	API.require("company");
	API.require("agency");
	API.require("staff");
	var companyList ={};
	companyList.CompanyListController = function($scope){
		$("title").html("公司列表");
		//企业管理首页信息
		$scope.initCompanyList = function(){
			$(".left_nav li").removeClass("on").eq(1).addClass("on");
			API.onload(function(){
				
				API.company.getCompanyListByAgency()
					.then(function(companylist){
						console.info(companylist);
						$scope.companylist = companylist;
						$scope.$apply();
						var tasks = companylist.map(function(company){
							// console.info(company.createUser)
							return Q.all([
								API.company.getCompanyFundsAccount(company.id)
								// API.staff.getStaff({id:company.createUser})
								])
							.spread(function(funds){
								console.info(funds);
								// console.info(user);
							})
						});
						return Q.all(tasks);
					})
					.then(function(){
						$scope.$apply();
					})
					.catch(function(err){
						console.info(err)
					})
			})
		}
		$scope.initCompanyList();
	}
	companyList.CompanyDetailController = function($scope,$routeParams){
		$("title").html("公司详情");
		var companyId = $routeParams.company;
		//企业管理详情页
		$scope.initCompanyDetail = function(){
			API.onload(function(){
				API.company.getCompany(companyId)
					.then(function(company){
						console.info(company);
						$scope.$apply();
					})
					.catch(function(err){
						console.info(err);
					})
			})
		}
	}

	return companyList;
})();