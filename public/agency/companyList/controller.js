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
				API.company.getCompanyListByAgency({page:$scope.page,perPage:20})
					.then(function(ret){
						//console.info (ret);
						$scope.total = ret.total;
						$scope.pages = ret.pages;
						var companylist = ret.items;
						var promises = companylist.map(function(company){
							// console.info(company.createUser)
							return Q.all([
								API.company.getCompanyFundsAccountByAgency(company.id),
								API.staff.getStaffByAgency({id: company.createUser}),
                        		API.staff.statisticStaffsByAgency({companyId:company.id}),
								API.agencyTripPlan.countTripPlanNum({companyId: company.id})
								])
							.spread(function(funds,staff,staffnum,trip){
								company.funds = funds;
								company.staff = staff;
								// console.info(staff)
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

		//分页
		$scope.pagination = function () {
			if ($scope.total) {
				$.jqPaginator('#pagination', {
					totalCounts: $scope.total,
					pageSize: 20,
					currentPage: 1,
					prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
					next: '<li class="next"><a href="javascript:;">下一页</a></li>',
					page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
					onPageChange: function (num) {
						if ($scope.pages==1) {
							$("#pagination").hide();
						}
						$scope.page = num;
						$scope.initCompanyList();
					}
				});
				clearInterval (pagenum);
			}
		}
		var pagenum =setInterval($scope.pagination,10);


		//进入创建企业页面
		$scope.goCreateCorp = function(){
			window.location.href = "#/companyList/CreateCorp";
		}
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
                        	API.company.getCompanyFundsAccountByAgency(companyId),
                        	API.staff.statisticStaffsByAgency({companyId:companyId}),
                        	// API.tripPlan.countTripPlanNum()
                        	API.agencyTripPlan.countTripPlanNum({companyId: companyId}),
							API.staff.statStaffPointsByAgency(companyId)
                        ])
                        .spread(function(staff,funds,staffnum,trip, points){
                        	$scope.tripnum = trip;
                        	$scope.staff = staff;
                        	$scope.funds = funds;
                        	$scope.staffnum = staffnum.all;
								$scope.points = points;
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

	//创建公司页面
	companyList.CreateCorpController = function($scope) {
		loading(true);
		$scope.createCorp = function(){
			var corpname = $("#corpName").val();
			var name = $("#connectName").val();
			var email = $("#connectEmail").val();
			var mobile = $("#connectMobile").val();
			var reg = /^[\w\.-]+?@([\w\-]+\.){1,2}[a-zA-Z]{2,3}$/;
			var domain = email.split(/@/);
			var commit = true;
			if(commit){
				if(!corpname){
					alert("企业名称是必填项！");
					return false;
				}else if(!name){
					alert("联系人姓名是必填项！");
					return false;
				}else if(!email){
					alert("邮箱是必填项！");
					return false;
				}else if(!reg.test(email)){
					alert("邮箱格式不正确！");
					return false;
				}else if(!mobile){
					alert("手机号是必填项！");
					return false;
				}else if(!mobile.match(/^[1][0-9]{10}$/)){
					alert("手机号格式不正确！");
					return false;
				}
				console.info(domain);
				console.info(domain[1]);
				API.onload(function(){
					console.info(API.company.createCompany());
					API.company.createCompany({name:corpname,userName:name,email:email,mobile:mobile,domain:domain[1]})
						.then(function(company){
							console.info(company);
							var id = company.id;
							window.location.href = "#/companyList/CompanyDetail?company=" + id;
						})
						.catch(function(err){
							console.info(err);
							alert(err.msg);
						}).done()
				})
			}
		}
	}
	return companyList;
})();