/**
 * Created by chenhao on 2015/12/29.
 */
module.exports = (function(){
	API.require("company");
	API.require("agency");
	API.require("staff");
	API.require('auth');
	API.require("tripPlan");
	API.require("agencyTripPlan");
	API.require('department');
	API.require('travelPolicy');
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
						TLDAlert(err.msg || err);
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
		$scope.companyId = companyId;
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
						TLDAlert(err.msg || err);;
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
						TLDAlert(err.msg || err);;
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
							TLDAlert(err.msg || err);;
						}).done()
				})
			}
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
							TLDAlert(err.msg || err);;
						}).done()
				})
			}
		}
	}

	//员工管理页面
	companyList.StaffListController = function($scope,$routeParams) {
		loading(true);
		var companyId = $routeParams.company;
		$scope.companyId = companyId;
		$(".left_nav li").removeClass("on").eq(1).addClass("on");

		//初始化所有的记录
		$scope.initstafflist = function(){
			//加载多个API方法
			API.onload(function(){
				var params = {};
				var options = {};
				options.perPage = 20;
				options.page = $scope.page;
				params.options = options;
				params.companyId = companyId;
				Q.all([
					API.travelPolicy.agencyGetAllTravelPolicy({where: {companyId:companyId}}),//获取当前所有的差旅标准名称
					API.staff.agencyListAndPaginateStaff(params),//加载所有的员工记录
					API.staff.agencyStatisticStaffsRole({companyId:companyId}),//统计企业员工（管理员 普通员工 未激活员工 总数）数量
					API.department.agencyGetFirstClassDepartments({companyId:companyId})//企业部门
				])
					.spread(function(travelPolicies,staffinfo,staffRole, departments){
						$scope.total = staffinfo.total;
						$scope.departments = departments;
						//获取差旅标准
						$scope.companyId = companyId;
						var arr = travelPolicies;
						var i ;
						$scope.selectClass = [
							{val:"",name:"请选择对应的差旅等级"}
						]//清空selectClass避免出现重复
						for(i=0; i<arr.length; i++){
							var name = arr[i].name;
							var id = arr[i].id;
							$scope.selectClass.push({val:id,name:name});//放入option中
							//console.info(id);

						}
						//加载员工列表
						$scope.staffs = staffinfo.items;
						//console.info($scope.staff);
						var tasks = $scope.staffs
							.map(function($staff){ //通过id拿到差旅标准的名字
								return Q.all([
									API.travelPolicy.agencyGetTravelPolicy({id:$staff.travelLevel,companyId: companyId}),
									API.auth.getAccountStatus({id:$staff.id})
								])
									.spread(function(travelLevel, acc){
										$staff.travelLeverName = travelLevel.name;//将相应的名字赋给页面中的travelLevelName
//                                                $staff.accStatus = acc.status==0?'未激活':(acc.status == -1?'禁用': '已激活');//账户激活状态
										if(acc){
											$staff.activeStatus = acc.status;
											$staff.accStatus = acc.status==0?'未激活':'';
										}
										$scope.$apply();
									})
							});
						//统计企业员工（管理员 普通员工 未激活员工）数量
						$scope.forActive = staffRole.unActiveNum;
						$scope.manager = staffRole.adminNum;
						$scope.publicStaff = staffRole.commonStaffNum;
						$scope.totalCount = staffRole.totalCount;
						return Q.all(tasks)
							.then(function(){
								$scope.$apply();
							})
					}).catch(function(err){
						TLDAlert(err.msg || err);;
					})
			})
		}

		$scope.initstafflist();

		//添加员工信息
		$scope.addStaff = function() {
			$("#add").addClass("onCheck");
			$(".add_staff").show();
		}
		//取消添加
		$scope.cancelAdd = function() {
			$(".add_staff").hide();
			$("#add").removeClass("onCheck");
		}

		//对差旅标准进行初始化
		$scope.selectkey = "";//设置初始化显示
		$scope.selectClass = [
			{val:"",name:"请选择对应的差旅等级"}
		]
		$scope.department = "";

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
						$scope.page = num;
						$scope.initstafflist();
					}
				});
				clearInterval (pagenum);
			}
		}
		var pagenum =setInterval($scope.pagination,10);


		//$scope.initstafflist();

		$scope.justInitList = function(department){
			API.onload(function(){
				var params = {};
				var options = {};
				options.perPage = 20;
				options.page = $scope.page;
				params.options = options;
				params.companyId = $scope.currentStaff.companyId;
				if(department && department!= ""){
					params.department = department;
				}
				return API.staff.agencyListAndPaginateStaff(params)//加载所有的员工记录
					.then(function(staffinfo){
						console.log(staffinfo);
						$scope.total = staffinfo.total;
						//加载员工列表
						$scope.staffs = staffinfo.items;
						var tasks = $scope.staffs
							.map(function($staff){ //通过id拿到差旅标准的名字
								return Q.all([
									API.travelPolicy.agencyGetTravelPolicy({id:$staff.travelLevel,companyId: companyId}),
									API.auth.getAccountStatus({id:$staff.id})
								])
									.spread(function(travelLevel, acc){
										$staff.travelLeverName = travelLevel.name;//将相应的名字赋给页面中的travelLevelName
//                                                $staff.accStatus = acc.status==0?'未激活':(acc.status == -1?'禁用': '已激活');//账户激活状态
										if(acc){
											$staff.activeStatus = acc.status;
											$staff.accStatus = acc.status==0?'未激活':'';
										}
										$scope.$apply();
									})
							});
						return Q.all(tasks)
							.then(function(){
								$scope.$apply();
							})
					})
					.catch(function(err){
						TLDAlert(err.msg || err);;
					})
			})
		}

		$scope.departmentChange = function(department){
			API.onload(function(){
				var params = {};
				var options = {};
				options.perPage = 20;
				options.page = $scope.page;
				params.options = options;
				params.companyId = $scope.currentStaff.companyId;
				if(department && department!= ""){
					params.department = department;
				}
				return API.staff.agencyListAndPaginateStaff(params)//加载所有的员工记录
					.then(function(staffinfo){
						console.log(staffinfo);
						$scope.total = staffinfo.total;
						$.jqPaginator('#pagination', {
							totalCounts: $scope.total,
							pageSize: 20,
							currentPage: 1,
							prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
							next: '<li class="next"><a href="javascript:;">下一页</a></li>',
							page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
							onPageChange: function (num) {
								$scope.page = num;
								$scope.justInitList(department);
							}
						});
						//加载员工列表
						$scope.staffs = staffinfo.items;
						var tasks = $scope.staffs
							.map(function($staff){ //通过id拿到差旅标准的名字
								return Q.all([
									API.travelPolicy.agencyGetTravelPolicy({id:$staff.travelLevel,companyId: companyId}),
									API.auth.getAccountStatus({id:$staff.id})
								])
									.spread(function(travelLevel, acc){
										$staff.travelLeverName = travelLevel.name;//将相应的名字赋给页面中的travelLevelName
										if(acc){
											$staff.activeStatus = acc.status;
											$staff.accStatus = acc.status==0?'未激活':'';
										}
										$scope.$apply();
									})
							});
						return Q.all(tasks)
							.then(function(){
								$scope.$apply();
							})
					})
					.catch(function(err){
						TLDAlert(err.msg || err);;
					})
			})

		}

		$scope.showDepartments = function(){
			$(".departmentlist").show();
		}

		//对员工信息进行保存的操作
		$scope.saveStaffInfo = function() {
			var name = $("#staffName").val();
			var mail = $("#staffEmail").val();
			var tel  = $("#staffTel").val();
			var department = $("#staffDepartment").val();
			var n = $("#staffStandard").val().length;//获取差旅标准id的长度
			var standard   = $("#staffStandard").val().substr(7,n);
			var power      = $("#staffPower").val();
			var commit = true;
			var filter  = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
			if(commit){
				if(!name){
					$scope.block_tip_err = "姓名是必填项！";
					$(".block_tip").show();
					return;
				}else if(!mail){
					$scope.block_tip_err = "邮箱是必填项！";
					$(".block_tip").show();
					return;
				}else if(!filter.test(mail)){
					$scope.block_tip_err = "邮箱格式错误！";
					$(".block_tip").show();
					return;
				}else if(!power){
					$scope.block_tip_err = "权限是必选项！";
					$(".block_tip").show();
					return;
				}else{
					$(".block_tip").hide();
				}
				API.onload(function() {//创建员工
					API.staff.agencyCreateStaff({name:name,mobile:tel,email:mail,companyId:$scope.companyId,department:department,travelLevel:standard,roleId:power})
						.then(function(staffinfo){
							$(".add_staff").hide();
							$(".block_tip").hide();
							$("#add").removeClass("onCheck");
							//$scope.initstafflist();
							$("#staffName").val("");
							$("#staffEmail").val("");
							$("#staffTel").val("");
							$("#staffDepartment").val("");
							$scope.selectkey = "";
							if($scope.roleId != 2){
								$("#staffPower").val("");
							}
							$scope.initstafflist();
							$scope.$apply();
						}).catch(function (err) {
							console.log(err);
							if(err.code == -29){
								$scope.block_tip_err = "该邮箱对应的账户已存在";
							}else if(err.code == -6){
								$scope.block_tip_err = "邮箱与创建人邮箱后缀不一致";
							}else{
								$scope.block_tip_err = err.msg;
							}
							$(".block_tip").show();
							$scope.$apply();
						}).done();
				})
			}
		}


		//对员工的信息进行修改
		$scope.editStaffInfo = function(id,index) {
			//$("#change"+index).addClass("orange");
			API.onload(function(){
				API.staff.agencyGetStaff({id: id,companyId: companyId})
					.then(function(staffinfo){
						$scope.travellevel = staffinfo.staff.travelLevel;
						$scope.selectkey = $scope.travellevel || "";
						$scope.$apply();
					}).catch(function(err){
						TLDAlert(err.msg || err);;
					}).done();
			})
		}



		//对员工所修改的信息进行保存
		$scope.updateStaffInfo = function(id,index){
			$(".includeChange").removeClass("orange");
			//alert(id);
			var name = $("#staffName"+index).val();
			var mail = $("#staffEmail"+index).val();
			var tel  = $("#staffTel"+index).val();
			var department = $("#staffDepartment"+index).val();
			var n = $("#staffStandard"+index).val().length;//获取差旅标准id的长度
			var standard   = $("#staffStandard"+index).val().substr(7,n);
			var power      = $("#staffPower"+index).val();
			var commit = true;

			API.onload(function(){
				API.staff.agencyUpdateStaff({id: id, name:name,mobile:tel,email:mail,department:department,travelLevel:standard,roleId:power,companyId: companyId})
					.then(function(newStaff){
						$(".add_staff2").hide();
						//$scope.initstafflist();
						$scope.initstafflist();
						$scope.$apply();
					}).catch(function(err){
						TLDAlert(err.msg || err);;
					}).done();
			})
		}

		//取消对员工信息的修改
		$scope.cancelAddStaffInfo = function(){
			$(".includeChange").removeClass("orange");
			$(".add_staff2").hide();
		}

		//删除员工的信息
		$scope.delStaffInfo = function(id, index) {
			//console.log(index);
			API.onload(function(){
				API.staff.agencyDeleteStaff({id:id,companyId: companyId})
					.then(function(newStaff){
						$scope.staffs.splice(index, 1);
						$scope.$apply();
						$scope.initstafflist();
					}).catch(function(err){
						TLDAlert(err.msg || err);;
					}).done();
			})
		}



		//删除员工信息
		$scope.deleteInfoShow = function (id,name) {
			$scope.deleteId = id;
			$scope.deleteName = name;
			$(".messageText").html("您确定删除&quot;"+$scope.deleteName+"&quot;吗？");
			$(".confirmFixed").show();
		}
		$scope.deleteInfo = function () {
			API.onload(function(){
				API.staff.agencyDeleteStaff({id:$scope.deleteId,companyId: companyId})
					.then(function(newStaff){
						$(".confirmFixed").hide();
						$scope.initstafflist();
					}).catch(function(err){
						TLDAlert(err.msg || err);;
					}).done();
			})
		}

		//关闭弹窗
		$scope.confirmClose = function () {
			$(".confirmFixed,.deleteFail").hide();
		}

		//批量添加员工
		$scope.addALotStaff = function(){
			$(".staff_tab_content,.pagination").hide();
			$(".staff_tab_import").show();
			$(".staff_tab_valid").hide();
			$(".staff_import_success").hide();
			//alert(123);
		}

		//从批量添加返回到员工管理页面
		$scope.backToAddStaff = function(){
			$(".staff_tab_content,.pagination").show();
			$(".staff_tab_import").hide();
			$(".staff_tab_valid").hide();
			$(".staff_import_success").hide();
			$scope.initstafflist();
		}

		//上传文件进入预览页
		$scope.uploadStaffFile = function(){
			$(".staff_tab_valid").show();
			$(".staff_tab_content").hide();
			$(".staff_tab_import").hide();
			$(".staff_import_success").hide();
			var md5key = $("#fileMd5key").val();
			API.onload(function(){
				//API.staff.getCurrentStaff()//获取当前登录人员的id
				//	.then(function(staffid){
				//console.info(staffid);
				//console.info(staffid.id);
				//console.info(md5key);
				API.staff.beforeImportExcel({md5key:md5key, companyId: companyId})
					.then(function(allData){
						//console.info(allData);
						//console.info(allData.noAddObj);
						$scope.invalid = JSON.parse(allData.noAddObj);
						$scope.valid = JSON.parse(allData.addObj);
						$scope.downloadInvalidData = allData.downloadNoAddObj;
						$scope.downloadValidData = allData.downloadAddObj;
						$scope.validData = JSON.parse(allData.addObj).length;
						$scope.invalidData = JSON.parse(allData.noAddObj).length;
						//$scope.totalData =
						//return $scope.valid;
						$scope.$apply();
					})
					.catch(function(err){
						TLDAlert(err.msg || err);;
					})
			})
		}

		//从预览界面返回至员工批量导入
		$scope.backToImport = function(){
			$(".staff_tab_valid").hide();
			$(".staff_tab_content").hide();
			$(".staff_import_success").hide();
			$(".staff_tab_import").show();
		}

		//下载无效数据列表
		$scope.downloadExcleData = function(type){
			API.onload(function(){
				//API.staff.getCurrentStaff()//获取当前登录人员的id
				//	.then(function(staffid){
				var objAttr = $scope.downloadInvalidData;
				if(type == "valid"){
					objAttr = $scope.downloadValidData;
				}
				API.staff.downloadExcle({accountId:staffid.id,objAttr:objAttr})
					.then(function(result){
						var filename = result.fileName;
						window.open('/download/excle-file/'+filename, "_blank");
						$scope.$apply();
					}).catch(function(err){
						TLDAlert(err.msg || err);;
					})
			}).catch(function(err){
				TLDAlert(err.msg || err);;
			}).done();
			//})
		}

		//确定导入数据
		$scope.importData = function(){
			//console.log($scope.valid);
			API.onload(function(){
				API.staff.importExcelAction({addObj:$scope.valid})
					.then(function(data){
						//console.info(data.addObj);
						//console.info(data.noAddObj);
						$(".staff_import_success").show();
						$(".staff_tab_valid").hide();
						$(".staff_tab_content").hide();
						$(".staff_tab_import").hide();
						$scope.$apply();
					}).catch(function(err){
						TLDAlert(err.msg || err);;
					}).done();
			})
		}
	}


	//组织架构页面
	companyList.DepartmentController = function($scope, $routeParams) {
		$("title").html("组织架构");
		loading(false);
		//初始化
		$scope.companyId = $routeParams.companyId;
		$scope.initdepartment = function(){
			API.onload(function(){
				API.department.agencyGetFirstClassDepartments({companyId:$scope.companyId})
					.then(function(defaulDepartment){
						console.info (defaulDepartment);
						var defaultname = defaulDepartment;
						$scope.departmentName = defaultname[0].name;
						$scope.departmentId = defaultname[0].id;
						//获取部门列表
						API.department.agencyGetChildDepartments({companyId:$scope.companyId,parentId:$scope.departmentId})
							.then(function(departmentlist){
								$scope.departmentlist = departmentlist;
								departmentlist.map(function(s){
									API.staff.getCountByDepartment({departmentId:s.id})
										.then(function(num){
											s.peoplenum = num;
											console.info ($scope.departmentlist);
											$scope.$apply();
										})
								});
							})
						$scope.$apply();
						loading(true);
					})
			})
		}
		$scope.initdepartment();


		//修改企业名称
		$scope.updateDepartmentShow = function () {
			$(".updatechildDepartment,.updatecompany,.createcompany").hide();
			$(".updatecompany").show();
		}
		$scope.updateDepartment = function () {
			API.onload(function(){
				API.department.agencyUpdateDepartment({companyId:$scope.companyId,id:$scope.departmentId,name:$(".updatecompany .common_text").val()})
					.then(function(result){
						Myalert("温馨提示","修改成功");
						$scope.initdepartment();
						$(".updatecompany").hide();
					})
					.catch(function(err){
						TLDAlert(err.msg || err);
					})
			})
		}

		//添加子部门
		$scope.createDepartmentShow = function () {
			$(".updatechildDepartment,.updatecompany,.createcompany").hide();
			$(".createcompany").show();
		}
		$scope.createDepartment = function () {
			API.onload(function(){
				API.department.agencyCreateDepartment({companyId:$scope.companyId,parentId:$scope.departmentId,name:$(".createcompany .common_text").val()})
					.then(function(result){
						Myalert("温馨提示","添加成功");
						$scope.initdepartment();
						$(".createcompany").hide();
					})
					.catch(function(err){
						TLDAlert(err.msg || err);
					})
			})
		}

		//修改子部门名称
		$scope.updatechildDepartmentShow = function (index,id) {
			$scope.index = index;
			$scope.childDepartmentId = id;
			$(".updatechildDepartment,.updatecompany,.createcompany").hide();
			$(".updatechildDepartment").eq(index).show();
		}
		$scope.updatechildDepartment = function () {
			API.onload(function(){
				API.department.agencyUpdateDepartment({companyId:$scope.companyId,id:$scope.childDepartmentId,name:$(".updatechildDepartment .common_text").eq($scope.index).val()})
					.then(function(result){
						Myalert("温馨提示","修改成功");
						$scope.initdepartment();
					})
					.catch(function(err){
						TLDAlert(err.msg || err);
					})
			})
		}

		//删除子部门
		$scope.deleteDepartmentShow = function (name,id) {
			$scope.deleteId = id;
			$scope.deleteName = name;
			$(".messageText").html("确定删除&quot;"+$scope.deleteName+"&quot;？");
			$(".confirmFixed").show();
		}
		$scope.deleteDepartment = function () {
			API.onload(function(){
				API.department.agencyDeleteDepartment({companyId:$scope.companyId,id:$scope.deleteId})
					.then(function(result){
						$scope.initdepartment();
						$(".confirmFixed").hide();
					})
					.catch(function(err){
						TLDAlert(err.msg || err);
					})
			})
		}

		//关闭窗口
		$scope.departmentClose = function () {
			$(".updatecompany,.createcompany,.updatechildDepartment").hide();
		}

		$scope.confirmClose = function () {
			$(".confirmFixed").hide();
		}
	}








	/*
	 差旅标准列表
	 * @param $scope
	 * @constructor
	 */
	companyList.PolicyListController = function($scope, $routeParams) {
		$("title").html("差旅标准");
		Myselect();
		$scope.companyId = $routeParams.companyId;

		//获取差旅标准列表
		$scope.initPolicyList = function () {
			loading(false);
			API.onload(function(){
				var params = {};
				var options = {order: [["create_at", "asc"]]};
				options.perPage = 100;
				params.options = options;
				params.companyId = $scope.companyId;
				API.travelPolicy.agencyListAndPaginateTravelPolicy(params)
					.then(function(result){
						console.info (result);
						$scope.PolicyTotal = result.total;
						$scope.PolicyList = result.items;
						if ($scope.PolicyTotal==0) {
							$(".create_policy").show();
						}
						$(window).scroll(function() {
							if ($(window).scrollTop()<=64) {
								$(".policy_title").removeClass('policy_titlefixed');

							}
							else {
								$(".policy_title").addClass('policy_titlefixed');
							}
						});
						loading(true);
						$scope.$apply();
					})
					.catch(function(err){
						console.info (err);
					});
			})
		}
		$scope.initPolicyList();


		//增加标准
		$scope.createPolicyShow = function () {
			$scope.resetting();
			$(".create_policy").show();
			$(".update_policy").hide();
			$(".policy_page li").css('opacity','1');
		}
		//增加标准取消
		$scope.createClose = function () {
			$(".create_policy").hide();
			$(".policy_page li").css('opacity','1');
		}
		$scope.createPolicy = function () {
			if ($(".create_policy .Cname").val()=="") {
				Myalert("温馨提示","请填写等级名称");
				return false;
			}
			if ($(".create_policy .CplaneLevel").html()=="请选择仓位") {
				Myalert("温馨提示","请选择飞机仓位");
				return false;
			}
			if ($(".create_policy .CplaneDiscount").html()=="请选择折扣") {
				Myalert("温馨提示","请选择飞机折扣");
				return false;
			}
			if ($(".create_policy .CtrainLevel").html()=="请选择座次") {
				Myalert("温馨提示","请选择火车座次");
				return false;
			}
			if ($(".create_policy .ChotelTevel").html()=="星级标准") {
				Myalert("温馨提示","请选择住宿标准");
				return false;
			}



			API.onload(function(){
				API.travelPolicy.agencyCreateTravelPolicy({
					name:$(".create_policy .Cname").val(),
					planeLevel:$(".create_policy .CplaneLevel").html(),
					planeDiscount:$(".create_policy .CplaneDiscount").attr('selectValue'),
					trainLevel:$(".create_policy .CtrainLevel").html().replace('/',','),
					isChangeLevel:$(".create_policy .Ccheckbox").attr('checkedd'),
					hotelLevel:$(".create_policy .ChotelTevel").html().replace('/',','),
					hotelPrice:$(".create_policy .ChotelPrice").val(),
					companyId:$scope.company_id
				})
					.then(function(result){
						Myalert("温馨提示","增加成功");
						$scope.initPolicyList();
						$(".create_policy").hide();
						console.info (result);
					})
					.catch(function(err){
						Myalert("温馨提示", err.msg);
						console.info (err);
					});
			})
		}


		//删除标准
		$scope.deletePolicyShow = function (id,name) {
			$scope.deleteId = id;
			$scope.deleteName = name;
			$(".messageText").html("您确定删除&quot;"+$scope.deleteName+"&quot;差旅标准吗？");
			$(".confirmFixed").show();
		}
		$scope.deletePolicy = function () {
			API.onload(function(){
				API.travelPolicy.agencyDeleteTravelPolicy({companyId:$scope.companyId,id:$scope.deleteId})
					.then(function(result){
						$(".confirmFixed").hide();
						$scope.initPolicyList();
						console.info (result);
					})
					.catch(function(err){
						$(".deleteFail").show();
						$(".deleteFail_text").html(err.msg);
						console.info (err);
					});
			})
		}

		//关闭弹窗
		$scope.confirmClose = function () {
			$(".confirmFixed,.deleteFail").hide();
		}








		//修改标准
		$scope.updatePolicyShow = function (id,index) {
			$scope.updateId = id;
			if (index == 0) {
				$(".update_policy").css({'top':'10px','left':'0px'});
			}
			else if (index == 1) {
				$(".update_policy").css({'top':'10px','left':'505px'});
			}
			else if (index == 2) {
				$(".update_policy").css({'top':'230px','left':'0px'});
			}
			else if (index == 3) {
				$(".update_policy").css({'top':'230px','left':'505px'});
			}
			else if (index == 4) {
				$(".update_policy").css({'top':'450px','left':'0px'});
			}
			else if (index == 5) {
				$(".update_policy").css({'top':'450px','left':'505px'});
			}
			else if (index == 6) {
				$(".update_policy").css({'top':'670px','left':'0px'});
			}
			else if (index == 7) {
				$(".update_policy").css({'top':'670px','left':'505px'});
			}
			else if (index == 8) {
				$(".update_policy").css({'top':'890px','left':'0px'});
			}
			else if (index == 9) {
				$(".update_policy").css({'top':'890px','left':'505px'});
			}
			else if (index == 10) {
				$(".update_policy").css({'top':'1110px','left':'0px'});
			}
			else if (index == 11) {
				$(".update_policy").css({'top':'1110px','left':'505px'});
			}
			else if (index == 12) {
				$(".update_policy").css({'top':'1330px','left':'0px'});
			}
			else if (index == 13) {
				$(".update_policy").css({'top':'1330px','left':'505px'});
			}
			else if (index == 14) {
				$(".update_policy").css({'top':'1550px','left':'0px'});
			}
			else if (index == 15) {
				$(".update_policy").css({'top':'1550px','left':'505px'});
			}
			var obj = {0:"全价",8:"最高8折",7:"最高7折",6:"最高6折",5:"最高5折",4:"最高4折"};
			var discountTxt = $scope.PolicyList[index].planeDiscount;
			$(".update_policy .Cname").val($scope.PolicyList[index].name);
			$(".update_policy .CplaneLevel").html($scope.PolicyList[index].planeLevel);
			$(".update_policy .CplaneDiscount").html(obj[discountTxt]).attr("selectValue",discountTxt);
			$(".update_policy .CtrainLevel").html($scope.PolicyList[index].trainLevel);
			$(".update_policy .Ccheckbox").attr('checked',$scope.PolicyList[index].isChangeLevel);
			$(".update_policy .ChotelTevel").html($scope.PolicyList[index].hotelLevel);
			$(".update_policy .ChotelPrice").val($scope.PolicyList[index].hotelPrice);
			if ($scope.PolicyList[index].isChangeLevel==true) {
				$(".Ccheckboxlabel").removeClass('lablefalse');
				$(" .Ccheckboxlabel").html('&#xe9ec;');
			}
			else {
				$(".Ccheckboxlabel").addClass('lablefalse');
				$(".Ccheckboxlabel").html('');
			}
			$(".update_policy").show();
			$(".create_policy").hide();
			$(".policy_page li").css('opacity','0.2');
		}
		//修改标准取消
		$scope.updateClose = function () {
			$(".update_policy").hide();
			$(".policy_page li").css('opacity','1');
		}
		$scope.updatePolicy = function () {
			if ($(".update_policy .Cname").val()=="") {
				Myalert("温馨提示","请填写等级名称");
				return false;
			}
			if ($(".update_policy .CplaneLevel").html()=="请选择仓位") {
				Myalert("温馨提示","请选择飞机仓位");
				return false;
			}
			if ($(".update_policy .CplaneDiscount").html()=="请选择折扣") {
				Myalert("温馨提示","请选择飞机折扣");
				return false;
			}
			if ($(".update_policy .CtrainLevel").html()=="请选择座次") {
				Myalert("温馨提示","请选择火车座次");
				return false;
			}
			if ($(".update_policy .ChotelTevel").html()=="星级标准") {
				Myalert("温馨提示","请选择住宿标准");
				return false;
			}


			API.onload(function(){
				API.travelPolicy.agencyUpdateTravelPolicy({
					id:$scope.updateId,
					name:$(".update_policy .Cname").val(),
					planeLevel:$(".update_policy .CplaneLevel").html(),
					planeDiscount:$(".update_policy .CplaneDiscount").attr('selectValue'),
					trainLevel:$(".update_policy .CtrainLevel").html(),
					isChangeLevel:$(".update_policy .Ccheckbox").attr('checkedd'),
					hotelLevel:$(".update_policy .ChotelTevel").html(),
					hotelPrice:$(".update_policy .ChotelPrice").val(),
					companyTd:$scope.company_id
				})
					.then(function(result){
						Myalert("温馨提示","修改成功");
						$scope.initPolicyList();
						$(".update_policy").hide();
						$(".policy_page li").css('opacity','1');
						console.info (result);
					})
					.catch(function(err){
						Myalert("温馨提示","内容不完整，请重新填写");
						console.info (err);
					});
			})
		}


		//重置
		$scope.resetting = function () {
			$(".Cname").val("");
			$(".CplaneLevel").html("不限");
			$(".CplaneDiscount").html("不限").attr("selectValue","0");
			$(".CtrainLevel").html("不限");
			$(".Ccheckbox").attr('checkedd',1);
			$(".Ccheckboxlabel").removeClass('lablefalse');
			$(".Ccheckboxlabel").html('&#xe9ec;');
			$(".ChotelTevel").html("不限");
			$(".ChotelPrice").val("");
		}

		//修改自定义复选框
		$scope.updateChangecheck = function () {
			if ($(".update_policy .Ccheckbox").attr('checkedd')!=1) {
				$(".update_policy .Ccheckboxlabel").removeClass('lablefalse');
				$(".update_policy .Ccheckboxlabel").html('&#xe9ec;');
				$(".update_policy .Ccheckbox").attr('checkedd',1);
			}
			else {
				$(".update_policy .Ccheckboxlabel").addClass('lablefalse');
				$(".update_policy .Ccheckboxlabel").html('');
				$(".update_policy .Ccheckbox").attr('checkedd',0);
			}
		}
		//创建自定义复选框
		$scope.createChangecheck = function () {
			if ($(".create_policy .Ccheckbox").attr('checkedd')!=1) {
				$(".create_policy .Ccheckboxlabel").removeClass('lablefalse');
				$(".create_policy .Ccheckboxlabel").html('&#xe9ec;');
				$(".create_policy .Ccheckbox").attr('checkedd',1);
			}
			else {
				$(".create_policy .Ccheckboxlabel").addClass('lablefalse');
				$(".create_policy .Ccheckboxlabel").html('');
				$(".create_policy .Ccheckbox").attr('checkedd',0);
			}
		}

	}






	return companyList;
})();