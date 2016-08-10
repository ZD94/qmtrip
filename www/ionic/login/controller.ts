"use strict";
var Cookie = require('tiny-cookie');
var msgbox = require('msgbox');
var API = require('common/api');
import validator = require('validator');

API.require('auth');

export function StorageSetController($scope, $stateParams, $storage) {
    let token_id = $stateParams.token_id;
    let user_id = $stateParams.user_id;
    let token_sign = $stateParams.token_sign;
    let timestamp = $stateParams.timestamp;
    let back_url = $stateParams.back_url;
    var data = { token_id: token_id,
        user_id: user_id,
        token_sign: token_sign,
        timestamp: timestamp };
    $storage.local.set('auth_data', data);
    //服务器端无法读取storage
    Cookie.set("user_id", data.user_id, {expires: 30});
    Cookie.set("token_sign", data.token_sign, {expires: 30});
    Cookie.set("timestamp", data.timestamp, {expires: 30});
    Cookie.set("token_id", data.token_id, {expires: 30});
    API.reload_all_modules();
    window.location.href = back_url;
}

export async function IndexController($scope, $stateParams, $storage, $sce, $loading) {
    $loading.start();
    var browserspec = require('browserspec');
    var backUrl = $stateParams.backurl || "#";
    require("./login.scss");
    //微信中自动登陆
    let href = window.location.href;
    if(browserspec.is_wechat && /.*jingli365\.com/.test(window.location.host) && !$stateParams.wxauthcode && !/.*backurl\=.*/.test(href)) {
        await API.onload();

        let url = await API.auth.getWeChatLoginUrl({redirectUrl: href});
        window.location.href = url;
        return;
    }else{
        $loading.end();
    }

    $scope.form = {
        email: Cookie.get("email") || '',
        pwd: Cookie.get("pwd") || ''
    };
    $scope.check_passed = ($scope.form.email.length > 0 && $scope.form.pwd.length > 5);
    $scope.$watchGroup(['form.email', 'form.pwd'], function(){
        $scope.check_passed = $scope.form.email && $scope.form.pwd && ($scope.form.email.length > 0 && $scope.form.pwd.length > 5);
        //$scope.check_changed = true;
    });

    $scope.focused = '';
    $scope.update_focused = function($event) {
        if ($event && $event.target)
            $scope.focused = $event.target;
        else
            $scope.focused = '';
    }

    $scope.check_login = async function ():Promise<any> {
        try {
            await API.onload();
            var data = await API.auth.login($scope.form);

            $storage.local.set('auth_data', data);
            //服务器端无法读取storage
            Cookie.set("user_id", data.user_id, {expires: 30});
            Cookie.set("token_sign", data.token_sign, {expires: 30});
            Cookie.set("timestamp", data.timestamp, {expires: 30});
            Cookie.set("token_id", data.token_id, {expires: 30});
            API.reload_all_modules();

            if(browserspec.is_wechat && $stateParams.wxauthcode) {
                //保存accountId和openId关联
                await API.onload();
                await API.auth.saveOrUpdateOpenId();
            }
            window.location.href = backUrl;
        } catch (err) {
            var str = err.msg;
            if(err.code == -28 && err.msg == "您的账号还未激活"){
                $scope.unactivated = true;
                // $scope.$apply();
            }else{
                msgbox.log(err.msg || err);//显示错误消息
            }
        }
    }

    $scope.reSendActiveLink = async function(){
        try{
            await API.onload();
            var data = await API.auth.reSendActiveLink({account: $scope.form.account});
            if(data){
                msgbox.log("发送成功");
            }

        }catch(err){
            msgbox.log(err.msg || err);
        }
    }
}

export async function TestController($scope) {
    $scope.initscan = function(){
        var backUrl = "http://"+window.location.host+"/index.html#/trip/create";
        API.onload(function() {
            API.auth.getQRCodeUrl({backUrl: backUrl, accountId: "c3d5f7c0-32e8-11e6-9af9-0710d114e84c", email: "yali.wang@jingli.tech"})
                .then(function(content) {
                    // new QRCode(document.getElementById("qrcode"), content);
                    var qrcode = require('arale-qrcode');
                    var browser = navigator.appName;
                    var b_version = navigator.appVersion;
                    var version = b_version.split(";");
                    if (version.length > 1) {
                        var trim_Version = parseInt(version[1].replace(/[ ]/g, "").replace(/MSIE/g, ""));
                        if (trim_Version < 9) {
                            // alert(“LowB,快升级你的IE”)
                            var qrnode = new qrcode({
                                correctLevel: 2,
                                render: 'svg',
                                text: content,
                                size: 256,
                                pdground: '#000000',
                                image : 'staff/images/logo.png',
                                imageSize:80
                            });
                            document.getElementById('qrcode').appendChild(qrnode);
                            return false;
                        }
                    }

                    var qrnode = new qrcode({
                        correctLevel: 2,
                        render: 'canvas',
                        text: content,
                        size: 256,
                        pdground: '#000000',
                        image : 'staff/images/logo.png',
                        imageSize:80
                    });
                    document.getElementById('qrcode').appendChild(qrnode);
                    return true;
                })
                .catch(function(err) {
                    alert(err);
                })
                .done();
        })
    }
    var time;
    var start = 60;
    var max = 60;
    $scope.alertScan = function(){
        var sw = $(".scancode").width()/2;
        var sh = $(".scancode").height()/2;
        $(".scancode").css({"margin-top":-sh,"margin-left":-sw});
        $("#qrcode").find("canvas").remove();
        $(".scan_fixed").show();
        if(time){
            clearInterval(time);
        }
        time = setInterval(function(){
            if(start<=0) {
                $("#qrcode").find("img").remove();
                $("#qrcode").find("canvas").remove();
                $scope.initscan();
                start=max;
            }else if(start >= max){
                $scope.initscan();
            }
            start = start -1;
            $scope.seconds = start;
            $scope.$apply();
        },1000);
    }
    $scope.close_scan = function(){
        start = max;
        clearInterval(time);
        $scope.seconds = start;
        $(".scan_fixed #qrcode").find("img").remove();
        $("#qrcode").find("canvas").remove();
        $(".scan_fixed").hide();
    }

    $scope.initscan();
}

export async function FirstSetPwdController ($scope, $stateParams) {
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
                    window.location.href = "index.html#/login/index";
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


export async function ForgetPwdController($scope,Models) {
    require("./forget-pwd.scss");
    API.require("auth");
    API.require("checkcode");
    $scope.form = {
        mobile:'',
        msgCode:''
    };
    var ticket;
    $scope.sendCode = async function(){
        await API.onload();
        API.checkcode.getMsgCheckCode({mobile: $scope.form.mobile})
            .then(function(result){
                ticket = result.ticket;
                console.info(ticket);
            })
            .catch(function(err){
                msgbox.log(err.msg||err)
            })
    };
    $scope.nextStep = async function(){
        await API.onload();
        API.auth.validateMsgCheckCode({msgCode: $scope.form.msgCode, msgTicket: ticket, mobile: $scope.form.mobile})
            .then(function(result){
                if(result){
                    window.location.href= "index.html#/login/reset-pwd?accountId="+result.accountId+"&sign="+result.sign+"&timestamp="+result.expireAt;
                }else{
                    msgbox.log("验证码错误");
                }
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })

    }
}

export async function ResetPwdController($scope, Models, $stateParams){
    API.require("auth");
    await API.onload();

    let accountId = $stateParams.accountId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;

    $scope.form = {
        newPwd: '',
        confirmPwd: ''
    }

    $scope.setPwd = function() {
        let newPwd = $scope.form.newPwd
        let confirmPwd = $scope.form.confirmPwd
        newPwd = trim(newPwd)
        confirmPwd = trim(confirmPwd);
        if(!newPwd){
            msgbox.log("新密码不能为空");
            return;
        }
        if(!confirmPwd){
            msgbox.log("重复密码不能为空");
            return;
        }
        if (newPwd != confirmPwd) {
            msgbox.log("两次密码不一致");
            return;
        }
        API.auth.resetPwdByMobile({accountId: accountId, sign: sign, timestamp: timestamp, pwd: newPwd})
            .then(function () {
                alert("密码设置成功,请重新登录");
                window.location.href = "index.html#/login/index";
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            }).done();
    }

}

export async function ActiveController ($scope, $stateParams) {
    let accountId = $stateParams.accountId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    API.require("auth");
    await API.onload();

    API.auth.activeByEmail({accountId: accountId, sign: sign, timestamp: timestamp})
        .then(function (result) {
            if(result){
                // alert("激活成功,请重新登录");
                // window.location.href = "index.html#/login/index";
            }
            return;
        })
        .catch(window.alert).done();

    $scope.goLogin = function(){
        window.location.href = "index.html#/login/index";
    }
}

export async function InvitedStaffOneController ($scope, $stateParams){
    require("./login.scss");
    let linkId = $stateParams.linkId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    API.require("auth");
    await API.onload();

    API.auth.checkInvitedLink({linkId: linkId, sign: sign, timestamp: timestamp})
        .then(async function (result) {
            if(result){
                $scope.inviter = result.inviter;
                $scope.comoany = result.company;
            }else{
                msgbox.log("激活链接已经失效");
                window.location.href = "index.html#/login/invalid-link";
            }
        })
        .catch(function(err){
            msgbox.log(err.msg||err);
            window.location.href = "index.html#/login/invalid-link";
        }).done();

    $scope.goRegister = function(){
        window.location.href = "index.html#/login/invited-staff-two?companyId="+$scope.comoany.id+"&linkId="+linkId+"&sign="+sign+"&timestamp="+timestamp;
    }
}

export async function InvitedStaffTwoController ($scope, $stateParams){
    let companyId = $stateParams.companyId;
    let linkId = $stateParams.linkId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    API.require("checkcode");
    API.require("auth");
    await API.onload();
    require("./login.scss");
    $scope.form = {
        mobile:'',
        msgCode:'',
        pwd:'',
        name:'',
        companyId: companyId
    };

    API.auth.checkInvitedLink({linkId: linkId, sign: sign, timestamp: timestamp})
        .then(async function (result) {
            if(result){
                if(result.company.id != companyId){
                    msgbox.log("无效链接");
                    window.location.href = "index.html#/login/invalid-link";
                }
                $scope.inviter = result.inviter;
                $scope.comoany = result.company;
            }else{
                msgbox.log("激活链接已经失效");
                window.location.href = "index.html#/login/invalid-link";
            }
        })
        .catch(function(err){
            msgbox.log(err.msg||err);
            window.location.href = "index.html#/login/invalid-link";
        }).done();

    $scope.sendCode = function(){
        if (!$scope.form.mobile) {
            msgbox.log("手机号不能为空");
            return;
        }
        API.auth.registerCheckEmailMobile({mobile: $scope.form.mobile})
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

    $scope.next = async function(){
        if (!$scope.form.mobile) {
            msgbox.log("手机号不能为空");
            return;
        }
        if ($scope.form.mobile && !validator.isMobilePhone($scope.form.mobile, 'zh-CN')) {
            msgbox.log("手机号格式不正确");
            return;
        }
        if (!$scope.form.msgCode) {
            msgbox.log("验证码不能为空");
            return;
        }
        if (!$scope.form.pwd) {
            msgbox.log("密码不能为空");
            return;
        }
        if (!$scope.form.name) {
            msgbox.log("姓名不能为空");
            return;
        }

        API.auth.invitedStaffRegister($scope.form)
            .then(function (result) {
                console.info(result);
                window.location.href = "index.html#/login/invited-staff-three?company="+result.name;
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            }).done();

    }
}

export async function InvitedStaffThreeController ($scope, $stateParams){
    require("./login.scss");
    let company = $stateParams.company;
    $scope.companyName = company;
    $scope.goLogin = function(){
        window.location.href = "index.html#/login/index";
    }
}

export async function InvalidLinkController ($scope, $stateParams){
    require("./login.scss");
}