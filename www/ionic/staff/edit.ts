import L from 'common/language';
import { Staff, EStaffRole } from 'api/_types/staff/staff';
import validator = require('validator');

var msgbox = require('msgbox');

export default async function EditController($scope, $storage, $stateParams, Models, $ionicHistory, $ionicPopup) {
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
        //标识管理员修改自身权限 修改后要重新登录
        // var logout = false;
        //标识企业拥有者修改管理员权限
        var ownerModifyAdmin = false;
        let _staff = $scope.staff;
        if (_staff.travelPolicyId && _staff.travelPolicyId.id) {
            _staff.travelPolicyId = _staff.travelPolicyId.id;
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

            /*if (!_staff.email) {
             throw L.ERR.EMAIL_EMPTY();
             }

            if (!validator.isEmail(_staff.email)) {
                throw L.ERR.EMAIL_FORMAT_INVALID();
            }
            f(company.domainName && company.domainName != "" && _staff.email.indexOf(company.domainName) == -1){
                throw L.ERR.EMAIL_SUFFIX_INVALID();
            }*/

            if (!_staff.mobile) {
                throw L.ERR.MOBILE_EMPTY();
            }

            if (_staff.mobile && !validator.isMobilePhone(_staff.mobile, 'zh-CN')) {
                throw L.ERR.MOBILE_NOT_CORRECT();
            }

            if (!staffId) {
                //管理员添加员工只能添加普通员工
                if(currentstaff.roleId == EStaffRole.ADMIN){
                    _staff.roleId = EStaffRole.COMMON;
                }
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
                if(!_staff.name){
                    msgbox.log('姓名不能为空');
                    return;
                }
                var namePattern = /[\u4e00-\u9fa5]+/g;
                var hasChinese = namePattern.test($scope.form.name);
                if(_staff.name.length>5 && hasChinese){
                    msgbox.log('姓名不能超过5个字');
                    return;
                }
                //管理员修改自身权限 修改后要重新登录
                /*if(preRole == EStaffRole.ADMIN && _staff.roleId == EStaffRole.COMMON && currentstaff.id == _staff.id){
                    logout = true;
                }*/

                // 创建人修改管理员权限(二次确认)
                if(currentstaff.roleId == EStaffRole.OWNER && preRole == EStaffRole.ADMIN && _staff.roleId == EStaffRole.COMMON){
                    ownerModifyAdmin = true;
                    $ionicPopup.show({
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

            //管理员修改自身权限 修改后要重新登录
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
        $ionicHistory.goBack(-1);
    }
}
