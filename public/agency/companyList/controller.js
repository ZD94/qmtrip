/**
 * Created by chenhao on 2015/12/29.
 */
module.exports = (function(){
	API.require("company");
	API.require("staff");
	API.require("tripPlan");
	API.require("travelPolicy");
	var companyList ={};
	companyList.CompanyListController = function($scope){
		$("title").html("首页");
		$(".left_nav li").removeClass("on").eq(0).addClass("on");
		//企业管理首页信息
		$scope.initCompanyList = function(){
			
			API.onload(function(){
				
			})
		}
		$scope.initCompanyList();
	}

	console.info(companyList)
	return companyList;
})();