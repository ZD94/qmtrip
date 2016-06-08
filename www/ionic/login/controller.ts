"use strict";
var Cookie = require('tiny-cookie');
var msgbox = require('msgbox');
var API = require('common/api');

API.require('auth');

export function IndexController($scope,$stateParams, $storage) {
    $scope.form = {
        email: Cookie.get("email") || '',
        pwd: Cookie.get("pwd") || ''
    };
    $scope.check_passed = ($scope.form.email.length > 0 && $scope.form.pwd.length > 5);
    $scope.$watchGroup(['form.email', 'form.pwd'], function(){
        $scope.check_passed = $scope.form.email && $scope.form.pwd && ($scope.form.email.length > 0 && $scope.form.pwd.length > 5);
        //$scope.check_changed = true;
    })

    $scope.focused = '';
    $scope.update_focused = function($event) {
        if ($event && $event.target)
            $scope.focused = $event.target;
        else
            $scope.focused = '';
        console.log($scope.focused);
    }
    
    var backUrl = $stateParams.backurl || "#";
    $scope.check_login = async function ():Promise<any> {
        try {
            await API.onload();
            var data = await API.auth.login($scope.form);
            $storage.local.set('auth_data', data);
            //Cookie.set("user_id", data.user_id, {expires: 30});
            //Cookie.set("token_sign", data.token_sign, {expires: 30});
            //Cookie.set("timestamp", data.timestamp, {expires: 30});
            //Cookie.set("token_id", data.token_id, {expires: 30});
            API.reload_all_modules();
            window.location.href = backUrl;
        } catch (err) {
            //console.info(err.msg);
            var str = err.msg;
            msgbox.log(err);//显示错误消息
        }
    }
}

export async function FirstSetPwdController ($scope, $stateParams, $location) {
    let accountId = $stateParams.accountId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    API.require("auth");
    await API.onload();

    $scope.form = {
        newPwd: '',
        confirmPwd: ''
    }

    $scope.setPwd = function() {
        let newPwd = $scope.form.newPwd
        let confirmPwd = $scope.form.confirmPwd
        console.info(newPwd, confirmPwd)
        if (newPwd && confirmPwd) {
            newPwd = trim(newPwd)
            confirmPwd = trim(confirmPwd);
            if (newPwd != confirmPwd) {
                alert("两次密码不一致");
                return;
            }
            API.auth.resetPwdByEmail({accountId: accountId, sign: sign, timestamp: timestamp, pwd: newPwd})
                .then(function () {
                    alert("密码设置成功,请重新登录");
                    window.location.href = "ionic.html#/login/index";
                    return;
                })
                .catch(window.alert).done();
        } else {
            alert("输入不完整");
        }
    }
}


function trim(s) {
    if (!s) return s;
    s = s.replace(/\s+/g, "");
    return s;
}