/**
 * Created by chenhao on 2015/12/29.
 */
module.exports = (function(){
	API.require("company");
	API.require("agency");
	var companyList ={};
	companyList.CompanyListController = function($scope){
		$("title").html("首页");
		// $(".left_nav li").removeClass("on").eq(0).addClass("on");
		//企业管理首页信息
		$scope.initCompanyList = function(){
			
			API.onload(function(){
				API.agency.getCurrentAgencyUser(function(err, agency){
					// console.info(err);
					// console.info(agency);
				})
					
				API.company.getCompanyListByAgency(function(err, list){
					console.info("*******************************");
					console.info(err);
					console.info(list);
					console.info("*******************************");
				})

				// API.company.getCompanyListByAgency()
				// 	.then(function(companylist){
				// 		console.info(companylist);
				// 		console.info("$$$$$$$$$$$$$$$$");
				// 		$scope.$apply();
				// 	})
				// 	.catch(function(err){
				// 		console.info(err)
				// 	})
			})
		}
		$scope.initCompanyList();
	}

	return companyList;
})();