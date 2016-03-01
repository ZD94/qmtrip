/**
 * Created by wlh on 16/1/27.
 */

'use strict';
module.exports = (function() {
    API.require('auth');
    //var Cookie = require('tiny-cookie');
    var auth = {};

    auth.LoginController = function($scope,$routeParams) {
        //待实现
        loading(true);
        //var mail = Cookie.get("email");
        //var pwd = Cookie.get("pwd");
        //$scope.email = mail;
        //$scope.pwd = pwd;
        var backUrl = $routeParams.backurl || "#";

        $scope.checkLogin = function() {
            var mail = $('#name').val();
            var pwd  = $('#pwd').val();
            //var remember = $("#remember").val();

            var commit = true;
            if(commit){
                if(!mail){
                    $scope.err_msg_mail = "请输入账号邮箱";
                    $("#name").siblings(".err_msg").children("i").html("&#xf06a;");
                    $("#name").siblings(".err_msg").children("i").removeClass("right");
                    $("#name").siblings(".err_msg").show();
                    $("#name").focus();
                    return false;
                }else if(!pwd){
                    //Myalert("提示", "登录密码不能为空");
                    $("#name").siblings(".err_msg").hide();
                    $scope.err_msg_pwd = "请输入密码";
                    $("#pwd").siblings(".err_msg").children("i").html("&#xf06a;");
                    $("#pwd").siblings(".err_msg").children("i").removeClass("right");
                    $("#pwd").siblings(".err_msg").show();
                    $("#pwd").focus();
                    return false;
                }
                API.onload(function(){
                    API.auth.login({email:mail,pwd:pwd})
                        .then(function(data){
                            //Cookie.set("user_id", data.user_id, { expires:30 });
                            //Cookie.set("token_sign", data.token_sign, { expires:30 });
                            //Cookie.set("timestamp", data.timestamp, { expires:30 });
                            //Cookie.set("token_id", data.token_id, { expires:30 });
                            //if (remember == true || remember == 'true') {
                            //    Cookie.set("email", mail);
                            //    Cookie.set("pwd", pwd);
                            //    Cookie.set("remember", remember);
                            //} else {
                            //    Cookie.remove("email");
                            //    Cookie.remove("pwd");
                            //    Cookie.remove("remember");
                            //}
                            //API.reload_all_modules();
                            alert("登陆成功");
                            window.location.href= backUrl;
                        }).catch(function(err){
                            if (err.msg) {
                                //alert(err.msg);
                                if(err.msg =='账号不存在'){
                                    $('.tip_err>a').text("马上注册");
                                    $scope.err_msg_tip = "该账号还未注册，";
                                    $('.tip_err').children("i").html("&#xf057;");
                                    $('.tip_err').show();
                                    $scope.$apply();
                                }
                                else if(err.msg == '您的账号还未激活'){
                                    $('.tip_err>a').text("");
                                    $('.tip_err>span').text("重新发送激活邮件");
                                    $scope.err_msg_tip = "该邮箱暂未激活，";
                                    $('.tip_err').children("i").html("&#xf057;");
                                    $('.tip_err').show();
                                    $scope.$apply();
                                }
                                else{
                                    $scope.err_msg_tip = err.msg;
                                    $('.tip_err').children("i").html("&#xf057;");
                                    $('.tip_err').show();
                                    //console.log(err.msg);
                                    $scope.$apply();
                                }
                                //Myalert("提示信息", err.msg);
                            } else {
                                //Myalert("系统错误", err);
                                console.log(err);
                            }
                        }).done();
                })
            }
        }
        API.onload(function(){
            $('#pwd').keydown(function(e){
                if(e.keyCode==13){
                    $scope.checkLogin(); //处理事件
                }
            })
        })

    }
    return auth;
})();