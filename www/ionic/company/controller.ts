/**
 * Created by seven on 16/5/9.
 */
"use strict";
import {EStaffRole, Staff, EStaffStatus} from "api/_types/staff";
import {EPlanStatus, ETripType, EAuditStatus} from 'api/_types/tripPlan';
import {TravelPolicy, MHotelLevel, MPlaneLevel, MTrainLevel} from "api/_types/travelPolicy";
import {Department} from "api/_types/department";
import validator = require('validator');
import _ = require('lodash');
import async = Q.async;
const moment = require("moment");
const API = require("common/api");
var L = require("common/language");
var msgbox = require('msgbox');


export async function ManagementController($scope, Models) {
    var staff = await Staff.getCurrent();
    var company = staff.company;
    var [staffs, policies,departments] = await Promise.all([
        company.getStaffs(),
        company.getTravelPolicies(),
        company.getDepartments()
    ]);
    $scope.staffsnum = staffs.length;
    $scope.departmentsnum = departments.length;
    $scope.policiesnum = policies.length;
}

export async function BudgetController($scope) {
    let months = [];
    let monthNow = moment().format('YYYY-MM');
    months.push({value: monthNow, name: '本月'});
    $scope.queryMonth = monthNow;

    for(let i=1; i<6; i++) {
        let month = moment(monthNow).subtract(i, 'months').format('YYYY-MM');
        months.push({value: month, name: month.replace(/(\w{4})\-(\w{1,2})/, '$1年$2月')});
    }

    $scope.months = months;

    $scope.staffSaves = [];
    API.require("tripPlan");
    await API.onload();

    $scope.staffSaves = await API.tripPlan.tripPlanSaveRank({limit: 3});
    let staff = await Staff.getCurrent();
    let company = staff.company;

    $scope.saveMoneyChart = {};
    $scope.saveMoneyChart.labels = ["本月节省", "本月支出"];
    await monthChange(monthNow);

    async function monthChange(queryMonth) {
        let statistic = await company.statisticTripPlanOfMonth({month: queryMonth});
        statistic.month = statistic.month.replace(/(\w{4})\-(\w{1,2})/, '$1年$2月');
        $scope.statistic = statistic;

        $scope.saveMoneyChart.data = [statistic.savedMoney || 0, statistic.expenditure || 1];

        $scope.option1 = {
            all: statistic.dynamicBudget,
            cover: statistic.dynamicBudget,
            title: statistic.dynamicBudget + '元'
        };
        $scope.isShow1 = true;

        $scope.option2 = {
            all: statistic.dynamicBudget,
            cover: statistic.savedMoney,
            title: statistic.savedMoney + '元'
        };
        $scope.isShow2 = true;
    }
    $scope.monthChange = monthChange;

}

export async function RecordController($scope) {
    let staff = await Staff.getCurrent();
    let company = staff.company;
    $scope.EPlanStatus = EPlanStatus;
    $scope.staffName = '';

    $scope.enterDetail = function(tripid){
        window.location.href = "#/company/record-detail?tripid="+tripid;
    };

    $scope.searchTripPlans = async function(staffName) {
        let status = [EPlanStatus.AUDIT_NOT_PASS, EPlanStatus.AUDITING, EPlanStatus.COMPLETE, EPlanStatus.NO_BUDGET, EPlanStatus.WAIT_COMMIT, EPlanStatus.WAIT_UPLOAD];
        if(!staffName) {
            $scope.tripPlans = await company.getTripPlans({where: {status: {$in: status}}});
            return;
        }
        let staffs = await company.getStaffs({where: {name: {$like: '%' + staffName + '%'}}});
        let ids = staffs.map((s) => s.id);
        $scope.tripPlans = await company.getTripPlans({where: {accountId: ids, status: {$ne: status}}});
    };

    await $scope.searchTripPlans();
}

export async function RecordDetailController($scope, Models, $stateParams, $ionicPopup, $ionicLoading){
    require('./trip-approval.scss');
    let tripId = $stateParams.tripid;
    let tripPlan = await Models.tripPlan.get(tripId);

    $scope.tripPlan = tripPlan;
    let staff = tripPlan.account; //await Models.staff.get(tripPlan.accountId);
    $scope.staff = staff;

    //判断有无审批权限
    let isHasPermissionApprove = false;
    let curStaff = await Staff.getCurrent();
    if(curStaff.id == tripPlan.auditUser) { isHasPermissionApprove = true;}
    $scope.isHasPermissionApprove = isHasPermissionApprove;

    let tripDetails = await tripPlan.getTripDetails();
    let traffic = [], hotel = [];
    let trafficBudget = 0, hotelBudget = 0, subsidyBudget = 0;
    let subsidyDays:number = moment(tripPlan.backAt).diff(moment(tripPlan.startAt), 'days');
    let totalBudget: number = 0;
    let budgetId;
    totalBudget = tripPlan.budget as number;
    tripDetails.forEach(function(detail) {
        switch (detail.type) {
            case ETripType.OUT_TRIP:
                traffic.push(detail);
                trafficBudget += detail.budget;
                break;
            case ETripType.BACK_TRIP:
                traffic.push(detail);
                trafficBudget += detail.budget;
                break;
            case ETripType.HOTEL:
                hotel.push(detail);
                hotelBudget += detail.budget;
                break;
            default: subsidyBudget += detail.budget; break;
        }
    })

    $scope.totalBudget = totalBudget;
    $scope.traffic = traffic;
    $scope.hotel = hotel;
    $scope.trafficBudget = trafficBudget;
    $scope.hotelBudget = hotelBudget;
    $scope.subsidyBudget = subsidyBudget;
    $scope.subsidyDays = subsidyDays;
    $scope.approveResult = EAuditStatus;
    $scope.EPlanStatus = EPlanStatus;

}

export async function DistributionController($scope, Models) {
    require('./trip-approval.scss');
    API.require("place");
    await API.onload();

    $scope.showPlace = function() {
        $(".staff-phone").hide();
        $(".staff-place").show();
        $("#phone-btn").removeClass('select-button');
        $("#place-btn").addClass('select-button');
    };

    $scope.showPhone = function() {
        $(".staff-place").hide();
        $(".staff-phone").show();
        $("#place-btn").removeClass('select-button');
        $("#phone-btn").addClass('select-button');
    };

    let staff = await Staff.getCurrent();
    let company = staff.company;

    $scope.dateObj = {selectedDate: new Date()};

    $scope.selectDate = async function () {
        $scope.isShowMap = false;

        let date = $scope.dateObj.selectedDate.valueOf();
        let staffTrips: any = await company.getTripPlans({where: {startAt: {$lte: date}, backAt: {$gte: date}, status: EPlanStatus.WAIT_UPLOAD},
            attributes: ["title", "account_id", "arrival_city_code"] , order: ["arrival_city_code"]});

        staffTrips = await Promise.all(staffTrips.map(async (v) => {
            let city = await API.place.getCityInfo({cityCode: v.arrivalCityCode});
            let staff = v.account;
            return {name: staff.name, mobile: staff.mobile, reason: v.title, longitude: city.longitude, latitude: city.latitude, cityName: city.name};
        }));

        let markerWidth = 30;
        let markerHeight = 35;
        let markers = staffTrips.map((v) => {
            return { title: v.name, content: v.reason, longitude: v.longitude, latitude: v.latitude, height: markerHeight, width: markerWidth}
        });

        $scope.map = null;
        $scope.loadMap = function(map) {
            $scope.map = map;
        };

        $scope.offlineOpts = {};
        $scope.staffTrips = staffTrips;

        let longitude = 116.404;
        let latitude = 39.915;
        if (markers && markers.length) {
            longitude = markers[0].longitude;
            latitude = markers[0].latitude;
        }
        $scope.mapOptions = {
            center: {
                longitude: longitude,
                latitude: latitude
            },
            zoom: 5,
            city: 'BeiJing',
            enableMessage: false,
            markers: markers
        };
        $scope.isShowMap = true;

        $scope.showPlace();
    };

    await $scope.selectDate();

    $scope.moveTo = function(long, lat) {
        if ($scope.map) {
            $scope.map.centerAndZoom(new window['BMap'].Point(long, lat), 5);
        }
    };
}

export async function DepartmentController($scope, Models, $ionicPopup, $ionicListDelegate) {
    $scope.showDelete = false;
    var staff = await Staff.getCurrent();
    async function loadDepartment(){
        var getdepartment = await Models.department.find({where: {companyId: staff.company.id}});
        var departments = getdepartment.map(function (department) {
            var depart = {department: department, staffnum: 0};
            return depart;
        });
        await Promise.all(departments.map(async function (depart) {
            var result = await depart.department.getStaffs();
            depart.staffnum = result.length;
            return depart;
        }));
        return departments;
    }
    $scope.departments = await loadDepartment();
    var newdepartment = $scope.newdepartment = Department.create();
    newdepartment["company"] = staff.company;
    $scope.newdepart = function () {
        $scope.newdepartment = Department.create();
        $scope.newdepartment.company = staff.company;
        var nshow = $ionicPopup.show({
            template: '<input type="text" ng-model="newdepartment.name">',
            title: '创建部门',
            scope: $scope,
            buttons: [
                {
                    text: '取消'
                },
                {
                    text: '保存',
                    type: 'button-positive',
                    onTap: async function (e) {
                        if (!$scope.newdepartment.name) {
                            e.preventDefault();
                            msgbox.log("部门名称不能为空");
                        } else {
                            try{
                                await $scope.newdepartment.save();
                                $scope.departments = await loadDepartment();
                            }catch(err){
                                msgbox.log(err.msg);
                            }
                            // $route.reload();
                        }
                    }
                }
            ]
        })
    }

    $scope.editDept = function (item) {
        $scope.newdepartment = item;
        var nshow = $ionicPopup.show({
            template: '<input type="text" ng-model="newdepartment.name">',
            title: '修改部门',
            scope: $scope,
            buttons: [
                {
                    text: '取消'
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        if (!$scope.newdepartment.name) {
                            e.preventDefault();
                            msgbox.log("部门名称不能为空");
                        } else {
                            await $scope.newdepartment.save();
                            $scope.departments = await loadDepartment();
                            // $route.reload();
                        }
                    }
                }
            ]
        })
    }
    
    $scope.deleteDept = function (department, index) {
        var nshow = $ionicPopup.show({
            title:'确定要删除部门吗?',
            scope: $scope,
            buttons:[
                {
                    text: '取消'
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function () {
                        try{
                            var dept = department.department;
                            if(department.staffnum > 0){//why后端delete方法throw出来的异常捕获不了
                                throw {code: -1, msg: '该部门下有'+ department.staffnum +'位员工，暂不能删除'};
                            }
                            await dept.destroy();
                            $scope.departments.splice(index, 1);
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        });
    }
}

export async function StaffsController($scope, Models, $ionicPopup) {
    var staff = await Staff.getCurrent();
    $scope.currentStaff = staff;
    $scope.staffs = [];
    var pager = await staff.company.getStaffs();
    loadStaffs(pager);

    $scope.pager = pager;
    var vm = {
        isHasNextPage:true,
        nextPage : async function() {
            try {
                pager = await $scope.pager['nextPage']();
            } catch(err) {
                this.isHasNextPage = false;
                return;
            }
            $scope.pager = pager;
            loadStaffs(pager);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    }

    $scope.vm = vm;
    
    function loadStaffs(pager) {
        pager.forEach(function(staff){
            var obj = {staff: staff, role: ""};
            if (obj.staff.roleId == EStaffRole.OWNER) {
                obj.role = '创建者';
            }
            $scope.staffs.push(obj);
        });
    }
    /*$scope.staffs = staffs.map(function (staff) {
        var obj = {staff: staff, role: ""};
        if (obj.staff.roleId == EStaffRole.OWNER) {
            obj.role = '创建者';
        }
        return obj;
    });*/
    await Promise.all($scope.staffs.map(async function (obj) {
        obj.travelPolicy = await obj.staff.getTravelPolicy();
        return obj;
    }));
    $scope.option = {name: ''};
    $scope.search = async function () {

        var staffs = await Models.staff.find({where: {companyId: staff.company.id, name: {$like: '%'+ $scope.option.name +'%'}}});
        $scope.staffs = staffs.map(function (staff) {
            var obj = {staff: staff, role: ""};
            if (obj.staff.roleId == EStaffRole.OWNER) {
                obj.role = '创建者';
            }
            return obj;
        });
        await Promise.all($scope.staffs.map(async function (obj) {
            obj.travelPolicy = await obj.staff.getTravelPolicy();
            return obj;
        }));
    }

    $scope.delete = async function(id, index) {
        var delshow = $ionicPopup.show({
            title: '确定删除该员工吗？',
            scope: $scope,
            buttons: [
                {
                    text: '取消',
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        try{
                            var delStaff = await Models.staff.get(id);
                            await delStaff.destroy();
                            $scope.staffs.splice(index, 1);
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        })
    }

    $scope.forbidden = async function(id, index) {
        var forshow = $ionicPopup.show({
            title: '确定禁用该员工吗？',
            scope: $scope,
            buttons: [
                {
                    text: '取消',
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        try{
                            var forbidStaff = await Models.staff.get(id);
                            forbidStaff.status = EStaffStatus.FORBIDDEN;
                            forbidStaff.staffStatus = EStaffStatus.FORBIDDEN;//同时修改account和staff两张表会有问题 只会修改一张表
                            await forbidStaff.save();
                            $scope.staffs.splice(index, 1);
                        }catch(err){
                            console.info(err);
                            msgbox.log(err.msg);

                        }
                    }
                }
            ]
        })
    }
}

export async function StaffdetailController($scope, $storage, $stateParams, Models, $ionicHistory, $ionicPopup) {
    let staff;
    let preRole;
    var currentstaff = await Staff.getCurrent();
    var company = currentstaff.company;
    let staffId = $stateParams.staffId;
    $scope.currentStaff = currentstaff;
    $scope.EStaffRole = EStaffRole;
    $scope.travelpolicylist = await company.getTravelPolicies();
    $scope.departmentlist = await company.getDepartments();
    if ($stateParams.staffId) {
        staff = await Models.staff.get($stateParams.staffId);
        preRole = staff.roleId;
    } else {
        staff = Staff.create();
        staff.company = company;
        if($scope.travelpolicylist && $scope.travelpolicylist.length>0){
            staff.travelPolicyId = $scope.travelpolicylist[0].id;
        }
        if($scope.departmentlist && $scope.departmentlist.length>0){
            staff.department = $scope.departmentlist[0];
        }
        staff.company = company;
    }
    $scope.staffId = $stateParams.staffId;
    $scope.staff = staff;
    var role = {id: false};
    if (staff.roleId == EStaffRole.ADMIN) {
        role.id = true;
    }
    $scope.role = role;

    $scope.savestaff = async function () {
        //标识管理员修改自身权限 修改后要重新登陆
        // var logout = false;
        //标识企业拥有者修改管理员权限
        var ownerModifyAdmin = false;
        let _staff = $scope.staff;
        if (_staff.travelPolicyId && _staff.travelPolicyId.id) {
            _staff.travelPolicyId = _staff.travelPolicyId.id;
        }
        //管理员添加员工只能添加普通员工
        if(currentstaff.roleId == EStaffRole.ADMIN){
            _staff.roleId = EStaffRole.COMMON;
        }

        if(currentstaff.roleId == EStaffRole.OWNER){
            if(_staff.roleId != EStaffRole.OWNER){
                if ($scope.role && $scope.role.id == true) {
                    _staff.roleId = EStaffRole.ADMIN;
                } else {
                    _staff.roleId = EStaffRole.COMMON;
                }
            }
        }
        try{
            if (!_staff.email) {
                throw L.ERR.EMAIL_EMPTY();
            }

            if (!_staff.mobile) {
                throw L.ERR.MOBILE_EMPTY();
            }

            if (!validator.isEmail(_staff.email)) {
                throw L.ERR.EMAIL_FORMAT_INVALID();
            }
            if(company.domainName && company.domainName != "" && _staff.email.indexOf(company.domainName) == -1){
                throw L.ERR.EMAIL_SUFFIX_INVALID();
            }

            if (_staff.mobile && !validator.isMobilePhone(_staff.mobile, 'zh-CN')) {
                throw L.ERR.MOBILE_NOT_CORRECT();
            }

            if (!staffId) {
                //如果不是更新,再去判断
                //查询邮箱是否已经注册
                /*var account1 = await Models.account.find({where: {email: _staff.email, type: 1}, paranoid: false});
                if (account1 && account1.length>0) {
                    throw L.ERR.EMAIL_HAS_REGISTRY();
                }

                if(_staff.mobile){
                    var account2 = await Models.account.find({where: {mobile: _staff.mobile, type: 1}, paranoid: false});
                    if (account2 && account2.length>0) {
                        throw L.ERR.MOBILE_HAS_REGISTRY();
                    }
                }*/
            }else{
                //如果是更新
                if(_staff.mobile){
                    var account2 = await Models.account.find({where: {mobile: _staff.mobile, type: 1, id: {$ne: _staff.id}}, paranoid: false});

                    if (account2 && account2.length>0) {
                        throw L.ERR.MOBILE_HAS_REGISTRY();
                    }
                }
                //管理员修改自身权限 修改后要重新登陆
                /*if(preRole == EStaffRole.ADMIN && _staff.roleId == EStaffRole.COMMON && currentstaff.id == _staff.id){
                    logout = true;
                }*/

                // 创建人修改管理员权限(二次确认)
                if(currentstaff.roleId == EStaffRole.OWNER && preRole == EStaffRole.ADMIN && _staff.roleId == EStaffRole.COMMON){
                    ownerModifyAdmin = true;
                    var nshow = $ionicPopup.show({
                        title: '确认要取消TA的管理员身份吗？',
                        scope: $scope,
                        buttons: [
                            {
                                text: '取消',
                                onTap: async function (e) {
                                    $scope.role = {id: true};
                                }
                            },
                            {
                                text: '确定',
                                type: 'button-positive',
                                onTap: async function (e) {
                                    _staff = await _staff.save();
                                    $ionicHistory.goBack(-1);
                                }
                            }
                        ]
                    })
                }
            }

            if(!ownerModifyAdmin){
                _staff = await _staff.save();
                $ionicHistory.goBack(-1);
            }

            //管理员修改自身权限 修改后要重新登陆
            /*if(logout){
                //重新登录
                var nshow = $ionicPopup.show({
                    title: '修改权限需重新登录',
                    scope: $scope,
                    buttons: [
                        {
                            text: '确定',
                            type: 'button-positive',
                            onTap: async function (e) {
                                await API.onload();
                                $storage.local.remove('auth_data');
                                API.reload_all_modules();
                                window.location.href = '#login/';
                                window.location.reload();
                            }
                        }
                    ]
                })
            }else{
                $ionicHistory.goBack(-1);
            }*/
        }catch (err){
            if(err.code == -1){
                $scope.staff.roleId = EStaffRole.ADMIN;
            }
            msgbox.log(err.msg);
        }

    }
    $scope.showrole = function () {
        $scope.staff.$fields = {};
        $scope.staff.$parents.account.$fields = {};
        /*if ($scope.role.id == true) {
            $scope.staff.roleId = EStaffRole.ADMIN;
        } else {
            $scope.staff.roleId = EStaffRole.COMMON;
        }*/
        $ionicHistory.goBack(-1);
    }
}

export async function TravelpolicyController($scope, Models, $location) {
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var travelPolicies = await company.getTravelPolicies();
    $scope.travelPolicies = travelPolicies.map(function (policy) {
        policy["hotelLevelName"] = MHotelLevel[policy.hotelLevel];
        policy["planeLevelName"] = MPlaneLevel[policy.planeLevel];
        policy["trainLevelName"] = MTrainLevel[policy.trainLevel];

        var obj = {policy: policy, usernum: ''};
        return obj;
    })
    await Promise.all($scope.travelPolicies.map(async function (obj) {
        var result = await obj.policy.getStaffs();
        obj.usernum = result.length;
        return obj;
    }))
    $scope.editpolicy = async function (id) {
        // var travelpolicy = await Models.travelPolicy.get(id);
        $location.path('/company/editpolicy').search({'policyId': id}).replace();
    }
}

export async function EditpolicyController($scope, Models, $stateParams, $ionicHistory) {
    var staff = await Staff.getCurrent();
    var travelPolicy;
    if ($stateParams.policyId) {
        travelPolicy = await Models.travelPolicy.get($stateParams.policyId);
    } else {
        travelPolicy = TravelPolicy.create();
        travelPolicy.companyId = staff.company.id;
        travelPolicy.planeLevel = 2;
        travelPolicy.trainLevel = 3;
        travelPolicy.hotelLevel = 2;
    }
    $scope.travelPolicy = travelPolicy;
    $scope.savePolicy = async function () {
        await $scope.travelPolicy.save();
        $ionicHistory.goBack(-1);
    }
    $scope.consoles = function (obj) {
        console.info(obj);
    }
}
