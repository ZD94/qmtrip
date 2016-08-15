/**
 * Created by seven on 16/8/8.
 */
'use strict';
import {Staff, EStaffRole} from 'api/_types/staff';
var msgbox = require('msgbox');
var API = require('common/api');

API.require('auth');
API.require('checkcode');

export async function IndexController($scope,Models) {
    require('./index.scss');
    API.require('tripPlan');
    var staff = await Staff.getCurrent();
    var tripBudget = await API.tripPlan.statisticTripBudget({isStaff: true});
    console.info(tripBudget);
    $scope.tripBudget = tripBudget;
    $scope.staff = staff;
    $scope.EStaffRole = EStaffRole;
}

export async function StaffInfoController($scope,Models) {
    require('./staffInfo.scss');
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.company = await staff.company;
    $scope.department = await staff.department;
    $scope.travelpolicy = await staff.getTravelPolicy(staff['travelPolicyId']);
    $scope.staffRole = ['创建者','员工','管理员','财务'];
}

export async function EditMobileController($scope,Models,$ionicHistory) {
    require('./editMobile.scss');
    await API.onload();
    var staff = await Staff.getCurrent();
    $scope.form = {
        pwd:'',
        mobile:'',
        msgCode:''
    }

    $scope.sendCode = function(){
        if (!$scope.form.mobile) {
            msgbox.log("手机号不能为空");
            return;
        }
        API.auth.checkEmailAndMobile({mobile: $scope.form.mobile})
            .then(async function(){
                return API.checkcode.getMsgCheckCode({mobile: $scope.form.mobile})
                    .then(function(result){
                        $scope.form.msgTicket =  result.ticket;
                        console.info( result.ticket);
                    })
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })
    };

    $scope.save = async function(){
        if (!$scope.form.pwd) {
            msgbox.log("登录密码不能为空");
            return;
        }
        if (!$scope.form.mobile) {
            msgbox.log("手机号不能为空");
            return;
        }
        if (!$scope.form.msgCode) {
            msgbox.log("验证码不能为空");
            return;
        }
        staff.modifyMobile({msgCode: $scope.form.msgCode, msgTicket: $scope.form.msgTicket, mobile: $scope.form.mobile, pwd: $scope.form.pwd})
            .then(function(result){
                msgbox.log("修改成功");
                $ionicHistory.goBack(-1);
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })
    }

}

export async function EditEmailController($scope,Models,$ionicHistory,$ionicPopup) {
    require('./editMobile.scss');
    await API.onload();
    var staff = await Staff.getCurrent();
    $scope.form = {
        pwd:'',
        email:''
    }
    $scope.save = async function(){
        if (!$scope.form.pwd) {
            msgbox.log("登录密码不能为空");
            return;
        }
        if (!$scope.form.email) {
            msgbox.log("邮箱不能为空");
            return;
        }
        staff.modifyEmail({ email: $scope.form.email, pwd: $scope.form.pwd })
            .then(async function(result){
                await API.onload();
                return API.auth.reSendActiveLink({email: $scope.form.email, accountId: staff.id});
            })
            .then(function(data){
                if(data){
                    var alert = $ionicPopup.alert({
                        title:'激活邮件发送成功',
                        template:'为保障您的权益和能够及时收到通知消息，请尽快到邮箱进行激活！',
                        okText:'确定'
                    }).then(function(res){
                        window.location.href = "index.html#/staff/index";
                    })
                    // window.location.href = "index.html#/staff/editEmailSuccess";
                }
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })
    }
}

export async function EditEmailSuccessController($scope,Models,$ionicHistory) {
    require('./editMobile.scss');
}

export async function EditPwdController($scope,Models,$ionicHistory,$storage,$ionicPopup) {
    require('./editMobile.scss');
    await API.onload();
    var staff = await Staff.getCurrent();
    $scope.form = {
        oldPwd:'',
        newPwd:'',
        confirmPwd:''
    }

    $scope.save = async function(){
        if (!$scope.form.oldPwd) {
            msgbox.log("登录密码不能为空");
            return;
        }
        if (!$scope.form.newPwd) {
            msgbox.log("新密码能为空");
            return;
        }
        if (!$scope.form.confirmPwd) {
            msgbox.log("确认密码能为空");
            return;
        }
        if ($scope.form.oldPwd == $scope.form.newPwd) {
            msgbox.log("原密码与新密码不能相同");
            return;
        }
        if ($scope.form.confirmPwd != $scope.form.newPwd) {
            msgbox.log("新密码与确认密码不一致");
            return;
        }
        await API.onload();
        staff.modifyPwd({ newPwd: $scope.form.newPwd, pwd: $scope.form.oldPwd })
            .then(async function(result){
                var nshow = $ionicPopup.show({
                    template: '<span>修改成功，请重新登录</span>',
                    title: '修改密码',
                    scope: $scope,
                    buttons: [
                        {
                            text: '确定',
                            type: 'button-positive',
                            onTap: async function (e) {
                                $scope.logout();
                            }
                        }
                    ]
                })
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })
    }

    $scope.logout = async function () {
        var browserspec = require('browserspec');
        if (browserspec.is_wechat) {
            await API.auth.destroyWechatOpenId({});
        }
        await API.onload();
        $storage.local.remove('auth_data');
        API.reload_all_modules();
        window.location.href = '#login/';
        window.location.reload();
    }
}