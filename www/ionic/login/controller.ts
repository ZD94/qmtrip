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

export async function IndexController($scope, $stateParams, $storage, $sce, $loading, $ionicPopup) {
    $loading.start();

    var browserspec = require('browserspec');
    var backUrl = $stateParams.backurl || "#";
    require("./login.scss");
    //微信中自动登录
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
                await API.auth.saveOrUpdateOpenId({code: $stateParams.wxauthcode});
            }

            window.location.href = backUrl;
        } catch (err) {
            //var str = err.msg;
            /*if(err.code == -28 && err.msg == "您的账号还未激活"){
                $scope.unactivated = true;
            }else */
            if(err.code == -37 && err.msg.indexOf("您的手机号还未验证") != -1){
                showMobilePopup();
            }else if(err.code == -38 && err.msg.indexOf("您的邮箱还未验证") != -1){
                showEmailPopup();
            }else{
                msgbox.log(err.msg || err);//显示错误消息
            }
        }

        function showEmailPopup(){
            $ionicPopup.show({
                title:'邮箱未激活',
                cssClass:'showAlert',
                template: '<div class="popupDiv"><span>请激活后再进行登录</span><br><span>邮箱：'+$scope.form.account+'</span></div>',
                scope: $scope,
                buttons: [
                    {
                        text: '返回重新登录',
                        type: 'button-small button-outline button-positive'
                    },
                    {
                        text: '获取激活邮件',
                        type: 'button-positive button-small',
                        onTap: async function (e) {
                            if (!$scope.form.account) {
                                e.preventDefault();
                                msgbox.log("用户名不能为空");
                            } else {
                                try{
                                    var data = await API.auth.reSendActiveLink({email: $scope.form.account});
                                    if(data){
                                        showSendEmailSuccess();
                                    }
                                }catch(err){
                                    msgbox.log(err.msg);
                                }
                            }
                        }
                    }
                ]
            })
        }

        function showSendEmailSuccess(){
            $ionicPopup.show({
                template: '<div class="popupDiv"><p>邮箱：{{form.account}}</p><br><h2><i class="ion-checkmark-circled"></i>激活邮件发送成功！</h2><br><span>请点击邮件中的链接完成激活，即可点击下方立即登录按钮进入系统，链接有效期24个小时</span></div>',
                cssClass:'showAlert',
                scope: $scope,
                buttons: [
                    {
                        text: '立即登录',
                        type: 'button-small button-positive',
                        onTap: async function (e) {
                            $scope.check_login();
                        }
                    }
                ]
            })
        }

        function showMobilePopup(){
            $ionicPopup.show({
                title: '手机未激活',
                template: '<div class="popupDiv"><span>请获取验证码激活</span><br><h2>手机号：'+$scope.form.account+'</h2>' +
                '<div class="item item-input"> <input type="text" placeholder="请输入验证码" ng-model="form.msgCode"> ' +
                '<a class="button button-small button-positive" ng-click="sendCode()"  ng-if="!showCount">发送验证码</a> ' +
                '<a class="button button-small button-stable" ng-if="showCount"><span id="countNum">{{beginNum}}</span>s</a>' +
                '</div>',
                cssClass:'showAlert',
                scope: $scope,
                buttons: [
                    {
                        text: '返回重新登录',
                        type: 'button-small button-outline button-positive'
                    },
                    {
                        text: '立即激活',
                        type: 'button-small button-positive',
                        onTap: async function (e) {
                            if (!$scope.form.msgCode) {
                                e.preventDefault();
                                msgbox.log("验证码不能为空");
                            } else {
                                try{
                                    var data = await API.auth.activeByMobile({mobile: $scope.form.account, msgCode: $scope.form.msgCode, msgTicket: $scope.ticket});
                                    if(data.isValidateMobile){
                                        showCheckMobileSuccess();
                                    }
                                }catch(err){
                                    msgbox.log(err.msg);
                                }
                            }
                        }
                    }
                ]
            })
        }

        function showCheckMobileSuccess(){
            $ionicPopup.show({
                title: '激活成功！',
                template: '<span>手机号：'+$scope.form.account+'</span>',
                scope: $scope,
                buttons: [
                    {
                        text: '立即登录',
                        type: 'button-positive',
                        onTap: async function (e) {
                            $scope.check_login();
                        }
                    }
                ]
            })
        }

        $scope.showCount = false;
        $scope.beginCountDown = function(){
            $scope.showCount = true;
            $scope.beginNum = 90;
            var timer = setInterval(function() {
                if ($scope.beginNum <= 0) {
                    $scope.showCount = false;
                    clearInterval(timer);
                    $scope.$apply();
                    return;
                }
                $scope.beginNum = $scope.beginNum - 1;
                $scope.$apply();
            }, 1000);
        }

        $scope.sendCode = async function(){
            if (!$scope.form.account) {
                msgbox.log("手机号不能为空");
                return;
            }
            API.require("checkcode");
            await API.onload();
            API.checkcode.getMsgCheckCode({mobile: $scope.form.account})
                .then(function(result){
                    $scope.beginCountDown();
                    $scope.ticket = result.ticket;
                })
                .catch(function(err){
                    msgbox.log(err.msg||err)
                })
        };

    }


    //暂不需要重新发送激活链接了
    /*$scope.reSendActiveLink = async function(){
        try{
            await API.onload();
            var data = await API.auth.reSendActiveLink({email: $scope.form.account});
            if(data){
                msgbox.log("发送成功");
            }

        }catch(err){
            msgbox.log(err.msg || err);
        }
    }*/
}

export async function CompanyRegisterController ($scope, $stateParams){

    API.require("checkcode");
    API.require("auth");
    await API.onload();
    require("./company-register.scss");
    $scope.form = {
        mobile:'',
        msgCode:'',
        pwd:'',
        name:'',
        userName:''
    };
    $scope.showCount = false;
    $scope.beginCountDown = function(){
        $scope.showCount = true;
        $scope.beginNum = 90;
        var timer = setInterval(function() {
            if ($scope.beginNum <= 0) {
                $scope.showCount = false;
                clearInterval(timer);
                $scope.$apply();
                return;
            }
            $scope.beginNum = $scope.beginNum - 1;
            $scope.$apply();
        }, 1000);
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
                        $scope.beginCountDown();
                        $scope.form.msgTicket =  result.ticket;
                    })
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })

    };

    $scope.submitRegister = async function(){
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
            msgbox.log("企业名称不能为空");
            return;
        }
        if (!$scope.form.userName) {
            msgbox.log("联系人不能为空");
            return;
        }
        var pwdPattern = /^[0-9a-zA-Z]*$/g;
        var newPwd = $scope.form.pwd;
        if(!pwdPattern.test(newPwd) || newPwd.length < 6 || newPwd.length >12){
            msgbox.log("密码格式应为6-12位字母或数字");
            return;
        }

        API.auth.registerCompany($scope.form)
            .then(function (result) {
                window.location.href = '#/login/company-welcome?company='+result.name;
                // window.location.href = "index.html#/login/company-register-success?company="+result.name;
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            }).done();

    }
}

export async function CompanyWelcomeController ($scope, $stateParams){
    require("./company-register.scss");
    let company = $stateParams.company;
    $scope.companyName = company;
    $scope.goLogin = function(){
        window.location.href = "index.html#/login/index";
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
                    //var browser = navigator.appName;
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

    $scope.showCount = false;
    $scope.beginCountDown = function(){
        $scope.showCount = true;
        $scope.beginNum = 90;
        var timer = setInterval(function() {
            if ($scope.beginNum <= 0) {
                $scope.showCount = false;
                clearInterval(timer);
                $scope.$apply();
                return;
            }
            $scope.beginNum = $scope.beginNum - 1;
            $scope.$apply();
        }, 1000);
    }

    var ticket;
    $scope.sendCode = async function(){
        if(!$scope.form.mobile){
            msgbox.log("手机号不能为空");
            return;
        }
        await API.onload();
        API.checkcode.getMsgCheckCode({mobile: $scope.form.mobile})
            .then(function(result){
                $scope.beginCountDown();
                ticket = result.ticket;
            })
            .catch(function(err){
                msgbox.log(err.msg||err)
            })
    };
    $scope.nextStep = async function(){
        if(!$scope.form.mobile){
            msgbox.log("手机号不能为空");
            return;
        }
        if(!$scope.form.msgCode){
            msgbox.log("验证码不能为空");
            return;
        }
        if(!ticket){
            msgbox.log("验证码不正确");
            return;
        }
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
        var pwdPattern = /^[0-9a-zA-Z]*$/g;
        if(!pwdPattern.test(newPwd) || newPwd.length < 6 || newPwd.length >20){
            msgbox.log("密码格式应为6-20位字母或数字");
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
    require('./active.scss');
    let accountId = $stateParams.accountId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    let email = $stateParams.email;//链接失效时重新发送激活邮件使用
    await API.onload();
    $scope.invalidLink = false;

    await API.auth.activeByEmail({accountId: accountId, sign: sign, timestamp: timestamp})
        .then(function (result) {
            if(result){
                $scope.account = result;
            }
        })
        .catch(function(err){
            if(err.code == -27 && err.msg == "激活链接已经失效"){
                $scope.invalidLink = true;
                $scope.email = email;
            }else{
                msgbox.log(err.msg||err);
            }
        }).done();

    $scope.reSendActiveLink = async function(){
        try{
            var data = await API.auth.reSendActiveLink({email: email});
            if(data){
                msgbox.log("发送成功");
            }
        }catch(err){
            msgbox.log(err.msg || err);
        }
    }

    $scope.goLogin = function(){
        window.location.href = "index.html#/login/index";
    }
}

export async function InvitedStaffOneController ($scope, $stateParams, $storage , $ionicPopup){
    require("./login.scss");
    let linkId = $stateParams.linkId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    API.require("auth");
    await API.onload();
    var auth_data = $storage.local.get('auth_data');
    await API.auth.checkInvitedLink({linkId: linkId, sign: sign, timestamp: timestamp})
        .then(async function (result) {
            if(result){
                $scope.inviter = result.inviter;
                $scope.comoany = result.company;
                if(auth_data && auth_data.user_id && $scope.inviter && auth_data.user_id == $scope.inviter.id){
                    //显示遮罩层
                    $ionicPopup.show({
                        template: '<p>请使用浏览器分享功能<br>将页面分享给好友</p>',
                        cssClass: 'share_alert'
                    })
                }
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

    $scope.showCount = false;
    $scope.beginCountDown = function(){
        $scope.showCount = true;
        $scope.beginNum = 90;
        var timer = setInterval(function() {
            if ($scope.beginNum <= 0) {
                $scope.showCount = false;
                clearInterval(timer);
                $scope.$apply();
                return;
            }
            $scope.beginNum = $scope.beginNum - 1;
            $scope.$apply();
        }, 1000);
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
                        $scope.beginCountDown();
                        $scope.form.msgTicket =  result.ticket;
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
        var pwdPattern = /^[0-9a-zA-Z]*$/g;
        var newPwd = $scope.form.pwd;
        if(!pwdPattern.test(newPwd) || newPwd.length < 6 || newPwd.length >20){
            msgbox.log("密码格式应为6-20位字母或数字");
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


export function TestPinchController ($scope){

    $scope.tap = function tap (event){
        console.info(event)
    }
    var img = document.getElementById('img') as HTMLImageElement;
    var canvas = document.getElementsByTagName('canvas')[0];
    var ctx = canvas.getContext('2d');
    var canvasScale = canvas.width / $(canvas).width();
    // setTimeout(function(){
    //     ctx.drawImage(img,(canvas.width-img.width)/2,(canvas.height-img.height)/2,img.width,img.height)
    // },1000)
    img.onload = function(){
        repaint();
    }
    var state = {
        offsetX: 0,
        offsetY: 0,
        centerX: 0,
        centerY: 0,
        scale: 1,
        rotate: 0
    };
    var origState: typeof state;

    function repaint(){
        //ctx.clear();
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        ctx.translate(state.centerX,state.centerY);
        ctx.scale(state.scale,state.scale);
        ctx.rotate(state.rotate*Math.PI/180);
        ctx.drawImage(img, state.offsetX, state.offsetY, img.width, img.height);
        ctx.restore();
    }

    $scope.hammerStart = function saveOrigState(event){
        console.info(event.type, event.deltaX, event.deltaY, event.scale, event.center, event.rotation);
        origState = _.clone(state);
        origState.rotate = origState.rotate - event.rotation;
    }

    $scope.hammerEnd = function onHammerEnd(event){
        console.info(event.type, event.deltaX, event.deltaY, event.scale, event.center);
        origState = undefined;
    }

    $scope.onHammer = function onHammer (event) {
        $scope.types = event.scale;
        console.info(event.type, event.deltaX, event.deltaY, event.scale, event.center, event.rotation);
        if(!origState){
            return;
        }
        //ctx.scale(event.scale,event.scale);
        if(event.type == 'pan'){
            let deltaX = event.deltaX * canvasScale;
            let deltaY = event.deltaY * canvasScale;
            state.centerX = origState.centerX+deltaX;
            state.centerY = origState.centerY+deltaY;
        }
        else if(event.type == 'pinch' || event.type == 'rotate'){
            let centerX = event.center.x;
            let centerY = event.center.y;
            let rect = canvas.getBoundingClientRect();
            centerX -= rect.left;
            centerY -= rect.top;
            state.offsetX = (origState.offsetX-(centerX-origState.centerX))*event.scale;
            state.offsetY = (origState.offsetY-(centerY-origState.centerY))*event.scale;
            state.centerX = centerX;
            state.centerY = centerY;

            state.scale = origState.scale*event.scale;
            state.rotate = origState.rotate + event.rotation;
        }
        repaint();
    }
}