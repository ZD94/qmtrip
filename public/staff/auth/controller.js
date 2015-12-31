
'use strict';
var auth=(function(){
    API.require('auth');
    API.require('checkcode');
    var  auth = {};
    var Cookie = require('tiny-cookie');

    //登录页面
    auth.LoginController = function ($scope, $routeParams) {
        $scope.toRegister = function(){
            window.location.href = "#/auth/register";
        }
        $scope.toForget = function(){
            window.location.href = "#/auth/forgetpwd";
        }
        var backUrl = $routeParams.backurl || "#";
        $scope.checkLogin = function() {
            var name = $('#name').val();
            var pwd  = $('#pwd').val();
            var commit = true;
            if(commit){
                if(!name){
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
                    API.auth.login({email:name,pwd:pwd})
                        .then(function(data){
                            console.info(data);
                            Cookie.set("user_id", data.user_id, { expires:30 });
                            Cookie.set("token_sign", data.token_sign, { expires:30 });
                            Cookie.set("timestamp", data.timestamp, { expires:30 });
                            Cookie.set("token_id", data.token_id, { expires:30 });
                            console.log("登录成功");
                            API.reload_all_modules();
                            window.location.href= backUrl;
                        }).catch(function(err){
                            if (err.msg) {
                                alert(err.msg);
                                console.log(err.msg);
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

    //注册页面
    auth.RegisterController = function($scope) {
        var pCode = $('#picCode').val();

        //对企业名称进行判断
        $("#corpName").blur(function(){
            var cName  = $('#corpName').val();
            if(!cName){
                $scope.err_msg = "企业名称不能为空";
                $("#corpName").siblings(".err_msg").children("i").html("&#xf06a;");
                $("#corpName").siblings(".err_msg").children("i").removeClass("right");
                $("#corpName").siblings(".err_msg").show();
                $("#corpName").focus();
                $scope.$apply();
                return false;
            }else{
                $scope.err_msg = "";
                $("#corpName").siblings(".err_msg").children("i").html("&#xf058;");
                $("#corpName").siblings(".err_msg").children("i").addClass("right");
                $("#corpName").siblings(".err_msg").show();
                $scope.$apply();
            }
        })
        //对联系人姓名进行判断
        $("#corpRegistryName").blur(function(){
            var name   = $('#corpRegistryName').val();
            if(!name){
                $scope.err_msg_name = "联系人姓名不能为空";
                $("#corpRegistryName").siblings(".err_msg").children("i").html("&#xf06a;");
                $("#corpRegistryName").siblings(".err_msg").children("i").removeClass("right");
                $("#corpRegistryName").siblings(".err_msg").show();
                $("#corpRegistryName").focus();
                $scope.$apply();
                return false;
            }else{
                $scope.err_msg_name = "";
                $("#corpRegistryName").siblings(".err_msg").children("i").html("&#xf058;");
                $("#corpRegistryName").siblings(".err_msg").children("i").addClass("right");
                $("#corpRegistryName").siblings(".err_msg").show();
                $scope.$apply();
            }
        })
        //对联系人邮箱进行判断
        $("#corpMail").blur(function(){
            var mail   = $('#corpMail').val();
            var reg = /^\w+[\w\-\.]+\w@\w[\w\-\.]+\w$/;
            if(!mail){
                $scope.err_msg_mail = "联系人邮箱不能为空";
                $("#corpMail").siblings(".err_msg").children("i").html("&#xf06a;");
                $("#corpMail").siblings(".err_msg").children("i").removeClass("right");
                $("#corpMail").siblings(".err_msg").show();
                $("#corpMail").focus();
                $(".tip_div").hide();
                $scope.$apply();
                return false;
            }else if(!reg.test(mail)){
                $scope.err_msg_mail = "邮箱格式不正确";
                //console.info(456);
                $("#corpMail").siblings(".err_msg").children("i").html("&#xf057;");
                $("#corpMail").siblings(".err_msg").children("i").removeClass("right");
                $("#corpMail").siblings(".err_msg").show();
                $("#corpMail").focus();
                $(".tip_div").hide();
                $scope.$apply();
                return false;
            }else{
                $scope.err_msg_mail = "";
                $("#corpMail").siblings(".err_msg").children("i").html("&#xf058;");
                $("#corpMail").siblings(".err_msg").children("i").addClass("right");
                $(".tip_div").hide();
                $("#corpMail").siblings(".err_msg").show();
                $scope.$apply();
            }
        })
        //对联系人电话进行判断
        $("#corpMobile").blur(function(){
            var mobile = $('#corpMobile').val();
            if(!mobile){
                $scope.err_msg_phone = "联系人电话不能为空";
                //console.info(99993333);
                $("#corpMobile").siblings(".err_msg").children("i").html("&#xf06a;");
                $("#corpMobile").siblings(".err_msg").children("i").removeClass("right");
                $("#corpMobile").siblings(".err_msg").show();
                $("#corpMobile").focus();
                $scope.$apply();
                return false;
            }else if(!mobile.match(/^[1][0-9]{10}$/)){
                $scope.err_msg_phone = "手机格式不正确";
                $("#corpMobile").siblings(".err_msg").children("i").html("&#xf057;");
                $("#corpMobile").siblings(".err_msg").children("i").removeClass("right");
                $("#corpMobile").siblings(".err_msg").show();
                $("#corpMobile").focus();
                $scope.$apply();
                return false;
            }else{
                $scope.err_msg_phone = "";
                $("#corpMobile").siblings(".err_msg").children("i").html("&#xf058;");
                $("#corpMobile").siblings(".err_msg").children("i").addClass("right");
                $("#corpMobile").siblings(".err_msg").show();
                $scope.$apply();
            }
        })
        //对密码强弱进行判断
        //图片验证码加载
        var imgW = $('#imgCode').attr("width");
        var imgH = $('#imgCode').attr("height");
        var msgTicket = "";//短信验证码凭证
        var picTicket = "";//图片验证码凭证
        API.onload(function(){
            API.checkcode.getPicCheckCode({width:imgW,height:imgH,quality:100,length:4})
                .then(function(result){
                    $("#imgCode").attr("src",result.captcha);
                    picTicket = result.ticket;
                }).catch(function(err){
                    console.info(err);
                }).done();
        })

        //获取短信验证码
        $scope.getMCode = function() {
            var mobile = $('#corpMobile').val();
            if(!mobile){
                $scope.err_msg_phone = "联系人电话不能为空";
                //console.info(123333);
                $("#corpMobile").siblings(".err_msg").children("i").html("&#xf06a;");
                $("#corpMobile").siblings(".err_msg").children("i").removeClass("right");
                $("#corpMobile").siblings(".err_msg").show();
                $("#corpMobile").focus();
                return false;
            }
            API.onload(function(){
                API.checkcode.getMsgCheckCode({mobile:mobile})
                    .then(function(result){
                        console.info("获取到的结果是:");
                        console.info(result);
                        //console.info("获取验证码", result);
                            msgTicket = result.ticket;
                            $scope.$apply();

                            var $seconds = $("#seconds");
                            var $timer = $("#timer");
                            var $btn = $(".v_code");
                            //显示倒计时
                            $btn.hide();
                            $timer.show();

                            var timer = setInterval(function() {
                                var begin = $seconds.text();
                                begin = parseInt(begin);
                                if (begin <=0 ) {
                                    clearInterval(timer);
                                    $btn.show();
                                    $timer.hide();
                                    $seconds.text(90);
                                } else {
                                    begin = begin - 1;
                                    $seconds.text(begin);
                                }
                            }, 1000);
                    }).catch(function(err){
                        if(err.msg) {
                            alert(err.msg);
                        }
                        console.info(err);
                    }).done();
            })

        }
        $("#msgCode").focus(function(){
            $scope.err_msg_msg = "请输入您手机短信中的验证码";
            $("#msgCode").parent("div").siblings(".err_msg").children("i").html("");
            $("#msgCode").parent("div").siblings(".err_msg").show();
            $scope.$apply();
        })
        $("#msgCode").blur(function(){
            var mCode = $('#msgCode').val();
            if(!mCode){
                $scope.err_msg_msg = "手机验证码不能为空";
                $("#msgCode").parent("div").siblings(".err_msg").children("i").html("&#xf06a;");
                $("#msgCode").parent("div").siblings(".err_msg").children("i").removeClass("right");
                $("#msgCode").parent("div").siblings(".err_msg").show();
                $scope.$apply();
                return false;
            }
        })
        //换一换图片验证码
        $scope.changePicCode = function(){
            API.onload(function(){
                API.checkcode.getPicCheckCode({width:imgW,height:imgH,quality:100,length:4})
                    .then(function(result){
                        //console.info("获取验证码图片", result);
                        $("#imgCode").attr("src",result.captcha);
                        picTicket = result.ticket;
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        //提交注册检验
        $scope.register = function() {
            var cName  = $('#corpName').val();
            var name   = $('#corpRegistryName').val();
            var mail   = $('#corpMail').val();
            var mobile = $('#corpMobile').val();
            var pwd    = $('#corpPwd').val();
            var mCode = $('#msgCode').val();
            var pCode = $('#picCode').val();
            var agree = $('.check').children("i").attr('checkvalue');
            var commit = true;
            //var reg = /^\w+[\w\-\.]+\w@\w[\w\-\.]+\w$/;
            if(commit){
                if(!cName){
                    $scope.err_msg = "企业名称不能为空";
                    $("#corpName").siblings(".err_msg").children("i").html("&#xf06a;");
                    $("#corpName").siblings(".err_msg").children("i").removeClass("right");
                    $("#corpName").siblings(".err_msg").show();
                    return false;
                }else if(!name){
                    $scope.err_msg_name = "联系人姓名不能为空";
                    $("#corpRegistryName").siblings(".err_msg").children("i").html("&#xf06a;");
                    $("#corpRegistryName").siblings(".err_msg").children("i").removeClass("right");
                    $("#corpRegistryName").siblings(".err_msg").show();
                    return false;
                }else if(!mail){
                    $scope.err_msg_mail = "联系人邮箱不能为空";
                    $("#corpMail").siblings(".err_msg").children("i").html("&#xf06a;");
                    $("#corpMail").siblings(".err_msg").children("i").removeClass("right");
                    $("#corpMail").siblings(".err_msg").show();
                    $(".tip_div").hide();
                    return false;
                }
                else if(!mobile){
                    $scope.err_msg_phone = "联系人电话不能为空";
                    $("#corpMobile").siblings(".err_msg").children("i").html("&#xf06a;");
                    $("#corpMobile").siblings(".err_msg").children("i").removeClass("right");
                    $("#corpMobile").siblings(".err_msg").show();
                    return false;
                }
                else if(!pwd){
                    $scope.err_msg_pwd = "密码不能为空";
                    $("#corpPwd").siblings(".err_msg").children("i").html("&#xf06a;");
                    $("#corpPwd").siblings(".err_msg").children("i").removeClass("right");
                    $("#corpPwd").siblings(".err_msg").show();
                    //$("#corpPwd").focus();
                    $(".tip_div2").hide();
                    return false;
                }else if(!mCode){
                    $scope.err_msg_msg = "手机验证码不能为空";
                    $("#msgCode").parent("div").siblings(".err_msg").children("i").html("&#xf06a;");
                    $("#msgCode").parent("div").siblings(".err_msg").children("i").removeClass("right");
                    $("#msgCode").parent("div").siblings(".err_msg").show();
                    return false;
                }else if(!pCode){
                    $scope.err_msg_pic = "图片验证码不能为空";
                    $("#imgCode").parent("div").siblings(".err_msg").children("i").html("&#xf06a;");
                    $("#imgCode").parent("div").siblings(".err_msg").children("i").removeClass("right");
                    $("#imgCode").parent("div").siblings(".err_msg").show();
                    return false;
                }else if(agree != "true"){
                    return false;
                }
                API.onload(function(){
                    var domain = mail.split(/@/);
                    if (domain && domain.length > 1) {
                        domain = domain[1];
                    } else {
                        alert("邮箱不合法");
                        return false;
                    }

                    API.auth.checkBlackDomain({domain: domain})
                        .catch(function(err){
                            alert("邮箱后缀不合法或者已被使用");
                            throw {};
                        })
                        .then(function(result) {
                            return API.auth.registryCompany({companyName:cName,name:name,email:mail,mobile:mobile,
                                pwd:pwd,msgCode:mCode,msgTicket:msgTicket,picCode:pCode,picTicket:picTicket});
                        })
                        .then(function(result){
                            console.info("注册返回的结果", result);
                            //alert("注册成功");
                            //window.location.href = "#/auth/login";
                            window.location.href = "#/auth/corplaststep?email="+mail;
                        })
                        .catch(function(err){
                            if (err.msg) {
                                alert(err.msg);
                                $scope.changePicCode();
                                $scope.$apply();
                                return;
                            }
                            console.error(err);
                        }).done();
                })
            }
        }

        $scope.toLogin = function(){
            window.location.href = "#/auth/login";
        }

    }

    //公司注册最后一步注册完成页面
    auth.CorplaststepController = function ($scope,$routeParams) {
        $scope.userMail = $routeParams.email;

        $scope.sendAgainActiveMail = function(){
            API.onload(function(){
                API.auth.sendActiveEmail({email:$scope.userMail})
                    .then(function(){
                        console.info("发送成功");
                        $scope.$apply();
                    }).catch(function(err){
                        console.error(err);
                    }).done();
            })
        }
    }

    //忘记密码页
    auth.ForgetpwdController = function($scope) {
        $scope.toRegister = function () {
            window.location.href = "#/auth/register";
        }
        //图片验证码加载
        var imgW = $('#imgCode').attr("width");
        var imgH = $('#imgCode').attr("height");
        var picTicket = "";//图片验证码凭证
        API.onload(function () {
            API.checkcode.getPicCheckCode({width: imgW, height: imgH, quality: 100, length: 4, type: 1})
                .then(function (result) {
                    $("#imgCode").attr("src", result.captcha);
                    picTicket = result.ticket;
                }).catch(function (err) {
                    console.info(err);
                }).done();
        })
        //换一换图片验证码
        $scope.changePicCode = function () {
            console.info("click me...")
            API.onload(function () {
                console.info("here...")
                API.checkcode.getPicCheckCode({width: imgW, height: imgH, quality: 100, length: 4})
                    .then(function (result) {
                        //console.info("获取验证码图片", result);
                        $("#imgCode").attr("src", result.captcha);
                        picTicket = result.ticket;
                    }).catch(function (err) {
                        console.info(err);
                    }).done();
            })
        }
    }

    //激活页面
    auth.ActiveController = function($scope, $routeParams) {
        var sign = $routeParams.sign;
        var accountId = $routeParams.accountId;
        var timestamp = $routeParams.timestamp;

        API.onload(function() {
            API.auth.activeByEmail({sign: sign, accountId: accountId, timestamp: timestamp})
                .then(function(result) {
                    if (result.code) {
                        $("#success_tip").hide();
                        $("#fail_tip").show();
                        $scope.activeResult = "链接不存在或者已经失效";
                    } else {
                        $("#fail_tip").hide();
                        $("#success_tip").show();
                        var $seconds = $("#second3");
                        var timer = setInterval(function() {
                            var begin = $seconds.text();
                            begin = parseInt(begin);
                            if (begin <=0 ) {
                                clearInterval(timer);
                                window.location.href= '#/auth/login';
                            } else {
                                begin = begin - 1;
                                $seconds.text(begin);
                            }
                        }, 1000);
                        $scope.activeResult = "恭喜您,账号激活成功!"
                    }

                    $scope.$apply();
                })
                .catch(function(err) {
                    console.info(err);
                    $("#success_tip").hide();
                    $("#fail_tip").show();
                    if (err.code) {
                        $scope.activeResult = err.msg;
                    } else {
                        $scope.activeResult = '系统错误,请稍后重试';
                    }
                    $scope.$apply();
                })
        })

            //$scope.activeResult = "恭喜您账号成功激活,关闭页面";
    }

    //登出页面
    auth.LogoutController = function($scope) {
        API.onload(function() {
            API.auth.logout(function(err, result) {
                if (err) {
                    alert("系统错误");
                } else {
                    window.location.href="#/auth/login";
                }
            })
        })
    }

    //员工设置密码页
    auth.ResetPwdController = function($scope, $routeParams){
        alert(456);
        var sign = $routeParams.sign;
        var timestamp = $routeParams.timestamp;

        $scope.checkStaffPwd = function(){
            alert(123);
            var pwd = $("#firstPwd").val();
            var pwds = $("#secondPwd").val();

            if(pwd != pwds){
                alert("两次密码输入不一致");
                return false;
            }

            API.onload(function() {
                API.auth.resetPwdByEmail({sign: sign, timestamp: timestamp,pwd:pwds})
                    .then(function(){
                        alert("设置密码成功");
                        $scope.$apply();
                }).catch(function(err){
                    console.error(err);
                }).done();
            })
        }
    }

    return auth;
})();

module.exports = auth;