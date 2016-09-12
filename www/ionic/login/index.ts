var msgbox = require('msgbox');

export async function IndexController($scope, $stateParams, $storage, $sce, $loading, $ionicPopup, $cookies) {
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
        email: $cookies.get("email") || '',
        pwd: $cookies.get("pwd") || ''
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
            var expires = new Date(Date.now() + 30*24*3600*1000);
            $cookies.put("user_id", data.user_id, {expires});
            $cookies.put("token_sign", data.token_sign, {expires});
            $cookies.put("timestamp", data.timestamp, {expires});
            $cookies.put("token_id", data.token_id, {expires});
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
