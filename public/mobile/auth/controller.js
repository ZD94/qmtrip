/**
 * Created by wlh on 16/1/27.
 */

'use strict';
module.exports = (function() {
    API.require('auth');
    var Cookie = require('tiny-cookie');
    var auth = {};

    auth.LoginController = function($scope,$routeParams) {
        //待实现
        $scope.$root.pageTitle = '登录';
        var mail = Cookie.get("email");
        var pwd = Cookie.get("pwd");
        $scope.email = mail;
        $scope.pwd = pwd;
        var backUrl = $routeParams.backurl || "#";

        $('.clear_input').css('display','none');

        $scope.clear_val = function($event) {
            $($event.target).siblings('input').val('');
            $('#login').attr('disabled',true).removeClass('blue_bc');
        }

        var checkLogin = $scope.check_login = function() {
            var mail = $('#name').val();
            var pwd  = $('#pwd').val();
            var commit = true;
            if(commit){
                API.onload(function(){
                    API.auth.login({email:mail,pwd:pwd})
                        .then(function(data){
                            Cookie.set("user_id", data.user_id, { expires:30 });
                            Cookie.set("token_sign", data.token_sign, { expires:30 });
                            Cookie.set("timestamp", data.timestamp, { expires:30 });
                            Cookie.set("token_id", data.token_id, { expires:30 });
                            API.reload_all_modules();
                            window.location.href= backUrl;
                        }).catch(function(err){
                            //console.info(err.msg);
                            var str = err.msg;
                            msgbox.log(str);//显示错误消息
                        }).done();
                })
            }
        }
        API.onload(function(){
            $('#pwd').keydown(function(e){
                if(e.keyCode==13){
                    checkLogin();
                }
            })
        })

    }
    return auth;
})();