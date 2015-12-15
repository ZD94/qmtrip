
'use strict';
var auth=(function(){
    API.require('auth');
    API.require('checkcode');
    var  auth = {};

    auth.LoginController = function ($scope, $routeParams) {
        var backUrl = $routeParams.backurl || "#/";
        $scope.checkLogin = function() {
            var name = $('#name').val();
            var pwd  = $('#pwd').val();
            var commit = true;
            if(commit){
                //alert(name);
                //alert(pwd);
                if(!name){
                    Myalert("提示", "登录名不能为空");
                    return false;
                }else if(!pwd){
                    Myalert("提示", "登录密码不能为空");
                    return false;
                }
                API.onload(function(){
                    API.auth.login({email:name,pwd:pwd})
                        .then(function(result){
                            if (result.code) {
                                alert(result.msg);
                            } else {
                                var data = result.data;
                                setCookie("user_id", data.user_id);
                                setCookie("token_sign", data.token_sign);
                                setCookie("timestamp", data.timestamp);
                                setCookie("token_id", data.token_id);
                                alert("登录成功");
                                window.location.href= backUrl;
                            }

                        }).catch(function(err){
                            console.info(err);
                            if (err.msg) {
                                Myalert("提示信息", err.msg);
                            } else {
                                Myalert("系统错误", err);
                            }
                        }).done();
                })
            }
        }
    }
    auth.RegisterController = function($scope) {

        //图片验证码加载
        var imgW = $('#imgCode').attr("width");
        var imgH = $('#imgCode').attr("height");
        var msgTicket = "";//短信验证码凭证
        var picTicket = "";//图片验证码凭证
        API.onload(function(){
            API.checkcode.getPicCheckCode({width:imgW,height:imgH,quality:100,length:4,type:1})
                .then(function(result){
                    //console.info(result);
                    //console.info(result.data.captcha);
                    //console.info(result.data.ticket);
                    $("#imgCode").attr("src",result.data.captcha);
                    picTicket = result.data.ticket;
                }).catch(function(err){
                    console.info(err);
                }).done();
        })

        //获取短信验证码
        $scope.getMCode = function() {
            var mobile = $('#corpMobile').val();
            if(!mobile){
                alert("手机号不能为空");
                return false;
            }else if(!mobile.match(/^[1][0-9]{10}$/)){
                alert("手机号格式不正确");
                return false;
            }
            API.onload(function(){
                API.checkcode.getMsgCheckCode({mobile:mobile})
                    .then(function(result){
                        if(result.code == 0){
                            //console.info(result.data.ticket);
                            //console.info(result.data.mobile);
                            msgTicket = result.data.ticket;
                            //return result.data.ticket;
                        }
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })

        }

        //换一换图片验证码
        $scope.changePicCode = function(){
            API.onload(function(){
                API.checkcode.getPicCheckCode({width:imgW,height:imgH,quality:100,length:4,type:1})
                    .then(function(result){
                        //console.info(result);
                        //console.info(result.data.captcha);
                        //console.info(result.data.ticket);
                        $("#imgCode").attr("src",result.data.captcha);
                        picTicket = result.data.ticket;
                        //return result.data.ticket;
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        $scope.register = function() {
            var cName  = $('#corpName').val();
            var name   = $('#corpRegistryName').val();
            var mail   = $('#corpMail').val();
            var mobile = $('#corpMobile').val();
            var pwd    = $('#corpPwd').val();
            var mCode = $('#msgCode').val();
            var pCode = $('#picCode').val();
            var agree = $('#check').attr('checkvalue');
            var commit = true;
            var myreg = /^([\.a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/;
            if(commit){
                if(!cName){
                    alert("企业名称不能为空!");
                    return false;
                }else if(!name){
                    alert("注册人姓名不能为空!");
                    return false;
                }else if(!mail){
                    alert("企业邮箱不能为空!");
                    return false;
                }
                //else if(!myreg.test(mail.value)){
                //    alert("邮箱格式不正确!");
                //    return false;
                //}
                else if(!mobile){
                    alert("联系人电话不能为空!");
                    return false;
                }else if(!mobile.match(/^[1][0-9]{10}$/)){
                    alert("手机号格式不正确!");
                    return false;
                }else if(!pwd){
                    alert("密码不能为空!");
                    return false;
                }else if(!mCode){
                    alert("短信验证码不能为空!");
                    return false;
                }else if(!pCode){
                    alert("图片验证码不能为空!");
                    return false;
                }
                //else if(!agree){
                //    return false;
                //}
                API.onload(function(){
                    API.auth.registryCompany({companyName:cName,name:name,email:mail,mobile:mobile,pwd:pwd,msgCode:mCode,msgTicket:msgTicket,picCode:pCode,picTicket:picTicket})
                        .then(function(result){
                            //console.info(result);
                            if(result.code == 0){
                                alert("注册成功");
                                window.location.href = "#/auth/login";
                            }
                        }).catch(function(err){
                            console.info(err);
                        }).done();
                })
            }
        }
    }
    return auth;
})();

module.exports = auth;