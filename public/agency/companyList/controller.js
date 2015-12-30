/**
 * Created by chenhao on 2015/12/29.
 */
module.exports = (function(){
	API.require("company");
	API.require("agency");
	API.require("staff");
	API.require("tripPlan");
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
								// console.info(funds);
								// console.info(user);
							})
						});
						return Q.all(tasks);
					})
					.then(function(){
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
			loading(false);
			API.onload(function(){
				API.company.getCompany(companyId)
					.then(function(company){
						// console.info(company);
						$scope.company = company;
						var staffId = company.createUser;
						var companyId = company.id;
						
						$scope.$apply();
                        loading(true);
                        console.info(staffId);
                        console.info(API.staff);
                        API.staff.getStaffByAgency(staffId, function(err, ret){
                        	console.info(err);
                        	console.info(ret);
                        })
                        Q.all([
                        	API.staff.getStaff(staffId),
                        	API.company.getCompanyFundsAccount(companyId),
                        	API.staff.statisticStaffs({companyId:companyId})
                        	// API.tripPlan.countTripPlanNum({})
                        ])
                        .spread(function(staff,funds,staffnum){
                        	console.info(staff);
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