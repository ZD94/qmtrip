/**
 * Created by chenhao on 2015/12/18.
 */
var UsersFirst = (function(){
	API.require("company");
	API.require("staff");
	var UsersFirst ={};
	UsersFirst.UserMainController = function($scope){
		$("title").html("全麦企业管理");
		//企业管理首页信息
		$scope.initCorpMain = function(){
			API.onload(function(){
				API.staff.getCurrentStaff()
					.then(function(ret){
						var company_id = ret.staff.companyId;
						API.company.getCompanyFundsAccount(company_id)
							.then(function(resutlt){
								$scope.balance = resutlt.fundsAccount.balance;
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