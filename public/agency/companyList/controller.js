/**
 * Created by chenhao on 2015/12/29.
 */
module.exports = (function(){
	API.require("company");
	API.require("agency");
	API.require("staff");
	API.require("tripPlan");
	API.require("agencyTripPlan");
	var companyList ={};
	companyList.CompanyListController = function($scope){
		loading(true);
		$("title").html("公司列表");
		//企业管理首页信息
		$scope.initCompanyList = function(){
			$(".left_nav li").removeClass("on").eq(1).addClass("on");
			loading(false);
			API.onload(function(){
				API.company.getCompanyListByAgency()
					.then(function(companylist){
						// console.info(companylist);
						var promises = companylist.map(function(company){
							// console.info(company.createUser)
							return Q.all([
								API.company.getCompanyFundsAccount(company.id),
								API.staff.getStaffByAgency({id: company.createUser}),
                        		API.staff.statisticStaffsByAgency({companyId:company.id}),
								API.agencyTripPlan.countTripPlanNum({companyId: company.id})
								])
							.spread(function(funds,staff,staffnum,trip){
								company.funds = funds;
								company.staff = staff;
								company.staffnum = staffnum;
								company.tirpnum = trip;
								return company;
							})
							.catch(function(err) {
								return company;
							});

						});
						return Q.all(promises);
					})
					.then(function(companylist){
						$scope.companylist = companylist;
						$scope.$apply();
                        loading(true);
					})
					.catch(function(err){
						console.info(err)
					})
			})
		}
		$scope.initCompanyList();
	}
	companyList.CompanyDetailController = function($scope,$routeParams){
		loading(true);
		$("title").html("公司详情");
		var companyId = $routeParams.company;
		//企业管理详情页
		$scope.initCompanyDetail = function(){
			$(".left_nav li").removeClass("on").eq(1).addClass("on");
			loading(false);
			API.onload(function(){
				API.company.getCompanyById(companyId)
					.then(function(company){
						// console.info(company);
						$scope.company = company;
						var staffId = company.createUser;
						var companyId = company.id;
						console.info(company)
						$scope.$apply();
                        loading(true);
                        Q.all([
                        	API.staff.getStaffByAgency({id:staffId}),
                        	API.company.getCompanyFundsAccount(companyId),
                        	API.staff.statisticStaffsByAgency({companyId:companyId}),
                        	// API.tripPlan.countTripPlanNum()
                        	API.agencyTripPlan.countTripPlanNum({companyId: companyId})
                        ])
                        .spread(function(staff,funds,staffnum,trip){
                        	$scope.tripnum = trip;
                        	$scope.staff = staff;
                        	$scope.funds = funds;
                        	$scope.staffnum = staffnum.all;
                        	$scope.$apply();
                        })
					})
					.catch(function(err){
						console.info(err);
					})
			})
		}
		$scope.initCompanyDetail();
		$scope.alertPop = function(){
			$(".charges").show();
			$(".cancel").click(function(){
				$(".charges").hide();
			})
		}
		$scope.recharge = function(){
			API.onload(function(){
				API.company.fundsCharge({companyId:$scope.company.id,channel:"代理商充值",money:$("#Money").val()})
					.then(function(result){
						console.info(result);
						$scope.initCompanyDetail();
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