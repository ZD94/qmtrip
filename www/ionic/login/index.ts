import { autobind } from 'core-decorators';
import IScope = angular.IScope;
import { LoginResponse } from '_types/auth/auth-cert';
import moment = require('moment');
var msgbox = require('msgbox');
var config = require('config');
var browserspec = require('browserspec');
declare var API;
declare var dd;

function isDingTalk() {
    return !!window['ddtalk'];
}

export interface IndexScope extends IScope{
    vm: IndexController;
}

@autobind
export class IndexController {
    account = '';
    pwd = '';
    check_passed = false;
    backUrl = '#';
    configName = '';
    showConfigName = false;
    beginNum = 90;
    showCount = false;
    ticket = '';
    msgCode = '';
    constructor(private $scope: IndexScope,
                private $stateParams,
                private $storage,
                private $loading,
                private $ionicPopup,
                private ddtalkApi
    ) {
        $scope.vm = this;

        this.backUrl = $stateParams.backurl || "#";

        require("./login.scss");
        //微信中自动登录
        let href = window.location.href;
        if(browserspec.is_wechat
            && /^[tj]\.jingli365\.com$/.test(window.location.host)
            //&& !/.*backurl\=.*/.test(href)
        ) {
            this.autoLoginForWechat();
            return;
        } else if(isDingTalk()) {
            this.autoLoginForDingtalk();
            return;
        }

        this.account = $storage.local.get("last_login_user") || '';
        this.pwd = '';
        $scope.$watchGroup(['vm.account', 'vm.pwd'], ()=>{
            this.check_passed = this.account && this.pwd
                && (this.account.length > 0 && this.pwd.length > 5);
        });

        config.$ready
            .then(()=> {
                this.configName = config.name;
                this.showConfigName = this.checkShowConfigName();
            });
    }
    async login(): Promise<any> {
        if(this.account == 'switchconfig@jingli.tech') {
            location.href = '#/login/switch-config';
            return;
        }
        try {
            await API.onload();
            var data = await API.auth.login({account:this.account, pwd:this.pwd});
            this.$storage.local.set("last_login_user", this.account);
            this.saveAndGoBackUrl(data);
        } catch(err) {
            /*if(err.code == -28 && err.msg == "您的账号还未激活"){
             $scope.unactivated = true;
             }else */
            /*if(err.code == -37 && err.msg.indexOf("您的手机号还未验证") != -1) {
                this.showMobilePopup();
            } else*/
            if(err.code == -38 && err.msg.indexOf("您的邮箱还未验证") != -1) {
                this.showEmailPopup();
            } else {
                msgbox.log(err.msg || err);//显示错误消息
            }
        }
    }
    async autoLoginForWechat(){
        await API.onload();
        if(!this.$stateParams.wxauthcode){
            let url = await API.auth.getWeChatLoginUrl({redirectUrl: window.location.href});
            window.location.href = url;
        }else{
            var data = await API.auth.authWeChatLogin({code: this.$stateParams.wxauthcode});
            if(data){
                this.saveAndGoBackUrl(data);
            }
        }
    }

    async saveAndGoBackUrl(data: LoginResponse){
        this.$storage.local.set('auth_data', data);
        API.reload_all_modules();

        //保存accountId和openId关联
        if(browserspec.is_wechat && this.$stateParams.wxauthcode) {
            await API.onload();
            await API.auth.saveOrUpdateOpenId({code: this.$stateParams.wxauthcode});
        }
        if (data['is_need_change_pwd']) {
            return window.location.href = '#/staff/change-pwd';
        }
        window.location.href = this.backUrl;
    }

    beginCountDown() {
        this.showCount = true;
        let nowTime = new Date();
        let newNow = moment(nowTime).add(90,'seconds');
        this.beginNum = moment(newNow).diff(moment(),'seconds');
        var timer = setInterval(()=>{
            if(this.beginNum <= 0) {
                this.showCount = false;
                clearInterval(timer);
                this.$scope.$apply();
                return;
            }
            this.beginNum = moment(newNow).diff(moment(),'seconds');
            this.$scope.$apply();
        }, 1000);
    }
    async sendCode() {
        if(!this.account) {
            msgbox.log("手机号不能为空");
            return;
        }
        API.require("checkcode");
        await API.onload();
        API.checkcode.getMsgCheckCode({mobile: this.account})
            .then((result)=>{
                this.beginCountDown();
                this.ticket = result.ticket;
            })
            .catch((err)=>{
                msgbox.log(err.msg || err)
            })
    };
    async autoLoginForDingtalk(): Promise<any>{
        try {
            let url = window.location.href;
            var corpid = window['ddtalk'].getCorpid();

            let ddtalkAuthCode = await
                new Promise((resolve, reject) => {
                    dd.runtime.permission.requestAuthCode({
                        corpId: corpid,
                        onSuccess: (result)=>{
                            resolve(result.code);
                        },
                        onFail: (err)=>{
                            reject(err);
                        }
                    })
                });
            //通过code换取用户基本信息
            let data = await API.ddtalk.loginByDdTalkCode({corpid: corpid, code: ddtalkAuthCode});
            this.saveAndGoBackUrl(data);
            return;
        } catch(err) {
            console.error(err);
            alert(JSON.stringify(err))
        }
    }
    checkShowConfigName() {
        if(location.host == 'j.jingli365.com')
            return false;
        if(!config.api)
            return false;
        if(config.api.substr(0, 4) == 'http') {
            var url = new URL(config.api);
            if(url.host == 'j.jingli365.com')
                return false;
        }
        return true;
    }

    showEmailPopup() {
        this.$ionicPopup.show({
            title: '邮箱未激活',
            cssClass: 'showAlert',
            template: '<div class="popupDiv"><span>请激活后再进行登录</span><br><span>邮箱：{{vm.account}}</span></div>',
            scope: this.$scope,
            buttons: [
                {
                    text: '返回重新登录',
                    type: 'button-small button-outline button-positive'
                },
                {
                    text: '获取激活邮件',
                    type: 'button-positive button-small',
                    onTap: async (e)=>{
                        if(!this.account) {
                            e.preventDefault();
                            msgbox.log("用户名不能为空");
                        } else {
                            try {
                                var data = await API.auth.reSendActiveLink({email: this.account});
                                if(data) {
                                    this.showSendEmailSuccess();
                                }
                            } catch(err) {
                                msgbox.log(err.msg);
                            }
                        }
                    }
                }
            ]
        })
    }

    showSendEmailSuccess() {
        this.$ionicPopup.show({
            template: '<div class="popupDiv"><p>邮箱：{{vm.account}}</p><br>' +
                '<h2><i class="ion-checkmark-circled"></i>激活邮件发送成功！</h2><br>' +
                '<span>请点击邮件中的链接完成激活，即可点击下方立即登录按钮进入系统，链接有效期24个小时</span></div>',
            cssClass: 'showAlert',
            scope: this.$scope,
            buttons: [
                {
                    text: '立即登录',
                    type: 'button-small button-positive',
                    onTap: async (e)=>{
                        this.login();
                    }
                }
            ]
        })
    }

    showMobilePopup() {
        this.$ionicPopup.show({
            title: '手机未激活',
            template: '<div class="popupDiv"><span>请获取验证码激活</span><br><h2>手机号：{{vm.account}}</h2>' +
            '<div class="item item-input"> <input type="text" placeholder="请输入验证码" ng-model="form.msgCode"> ' +
            '<a class="button button-small button-positive" ng-click="sendCode()"  ng-if="!showCount">发送验证码</a> ' +
            '<a class="button button-small button-stable" ng-if="showCount"><span id="countNum">{{beginNum}}</span>s</a>' +
            '</div>',
            cssClass: 'showAlert',
            scope: this.$scope,
            buttons: [
                {
                    text: '返回重新登录',
                    type: 'button-small button-outline button-positive'
                },
                {
                    text: '立即激活',
                    type: 'button-small button-positive',
                    onTap: async (e)=>{
                        if(!this.msgCode) {
                            e.preventDefault();
                            msgbox.log("验证码不能为空");
                        } else {
                            try {
                                var data = await API.auth.activeByMobile({
                                    mobile: this.account,
                                    msgCode: this.msgCode,
                                    msgTicket: this.ticket
                                });
                                if(data.isValidateMobile) {
                                    this.showCheckMobileSuccess();
                                }
                            } catch(err) {
                                msgbox.log(err.msg);
                            }
                        }
                    }
                }
            ]
        })
    }

    showCheckMobileSuccess() {
        this.$ionicPopup.show({
            title: '激活成功！',
            template: '<span>手机号：{{vm.account}}</span>',
            scope: this.$scope,
            buttons: [
                {
                    text: '立即登录',
                    type: 'button-positive',
                    onTap: async (e)=>{
                        this.login();
                    }
                }
            ]
        })
    }
}
