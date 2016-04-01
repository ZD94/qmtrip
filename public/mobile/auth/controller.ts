/**
 * Created by wlh on 16/1/27.
 */

'use strict';

declare var API: any;
declare var msgbox: any;

API.require('auth');
var Cookie = require('tiny-cookie');
var auth = {};

export function LoginController($scope,$routeParams) {
    //待实现
    $scope.$root.pageTitle = '登录';
    $scope.form = {
        email: Cookie.get("email") || '',
        pwd: Cookie.get("pwd") || ''
    };
    $scope.check_passed = ($scope.form.email.length > 0 && $scope.form.pwd.length > 5);
    $scope.$watchGroup(['form.email', 'form.pwd'], function(){
        $scope.check_passed = ($scope.form.email.length > 0 && $scope.form.pwd.length > 5);
    })
    var backUrl = $routeParams.backurl || "#";

    $scope.check_login = async function() {
        try {
            await API.onload();
            var data = await API.auth.login($scope.form);
            Cookie.set("user_id", data.user_id, { expires:30 });
            Cookie.set("token_sign", data.token_sign, { expires:30 });
            Cookie.set("timestamp", data.timestamp, { expires:30 });
            Cookie.set("token_id", data.token_id, { expires:30 });
            API.reload_all_modules();
            window.location.href= backUrl;
        } catch(err) {
            //console.info(err.msg);
            var str = err.msg;
            msgbox.log(str);//显示错误消息
        }
    }
    $scope.pwd_keydown = function($event){
        if($event.keyCode==13){
            $scope.check_login();
        }
    }

}
