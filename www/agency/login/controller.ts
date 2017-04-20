/**
 * Created by seven on 16/7/4.
 */
"use strict";

const API = require("@jingli/dnode-api");
var msgbox = require('msgbox');

export async function LoginController($scope, $stateParams, $storage){
    var backUrl = $stateParams.backurl || "#";
    $scope.checkLogin = async function () {
        var name = $('#agencyName').val();
        var pwd = $('#agencyPwd').val();
        if(!name) {
            alert("用户名不能为空！");
            return false;
        } else if(!pwd) {
            alert("登录密码不能为空!");
            return false;
        }

        API.require("auth");
        await API.onload();
        try{
            var data = await API.auth.login({account: name, pwd: pwd, type: 2});
            $storage.local.set('agency_auth_data', data);
            alert("登录成功");
            API.reload_all_modules();
            window.location.href = backUrl;
        }catch(err){
            if(err.msg) {
                msgbox.log(err.msg);
            } else {
                msgbox.log(err);
            }
        }
    }
}