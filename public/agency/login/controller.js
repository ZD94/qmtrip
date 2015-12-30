
'use strict';
var login=(function(){
    API.require('auth');
    API.require("checkcode");
    var login = {};
    var Cookie = require('tiny-cookie');

    login.LoginController = function ($scope, $routeParams) {

        var backUrl = $routeParams.backurl || "#/";
        $scope.checkLogin = function() {
            var name = $('#agencyName').val();
            var pwd  = $('#agencyPwd').val();
            var commit = true;
            if(commit){
                if(!name){
                    alert("用户名不能为空！");
                    return false;
                }else if(!pwd){
                    alert("登录密码不能为空!");
                    return false;
                }

                API.onload(function(){
                    console.info(API)
                    API.auth.login({email:name,pwd:pwd, type: 2})
                        .then(function(data){
                            Cookie.set("agent_id", data.user_id, { expires:30 });
                            Cookie.set("token_sign", data.token_sign, { expires:30 });
                            Cookie.set("timestamp", data.timestamp, { expires:30 });
                            Cookie.set("token_id", data.token_id, { expires:30 });
                            alert("登录成功");
                            API.reload_all_modules();
                            window.location.href= backUrl;
                        }).catch(function(err){
                            console.info(err);
                            if (err.msg) {
                                alert(err.msg);
                                //Myalert("提示信息", err.msg);
                            } else {
                                //Myalert("系统错误", err);
                                alert(err);
                            }
                        }).done();
                })
            }
        }
    }

    return login;
})();

module.exports = login;