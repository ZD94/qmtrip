
import L from 'common/language';
import { getSession } from 'common/model';
import { signToken, LoginResponse, genAuthString } from 'api/_types/auth/auth-cert';
import initJPush from './jpush';
require('ionic');

declare var ionic;

function getAuthData(): LoginResponse {
    var data = localStorage.getItem('auth_data');
    try{
        return JSON.parse(data);
    }catch(e){
        return null;
    }
}

window['getAuthDataStr'] = function(): string {
    let data = getAuthData();
    if(!data || !data.accountId || !data.tokenId || !data.token) {
        return '';
    }
    var tokenId = data.tokenId;
    var timestamp = new Date();
    var sign = signToken(data.accountId, data.tokenId, data.token, timestamp);
    return genAuthString({tokenId, timestamp, sign});
}

function apiAuth(remote, callback) {
    var data = getAuthData();
    if(!data || !data.accountId || !data.tokenId || !data.token) {
        return callback(L.ERR.NEED_LOGIN, remote);
    }
    var now = new Date();
    var sign = signToken(data.accountId, data.tokenId, data.token, now);
    remote.authenticate({
            tokenId: data.tokenId,
            timestamp: now,
            sign: sign,
        },
        function(err, res) {
            if(!err) {
                var session = getSession();
                session.accountId = data.accountId;
                let needJPushId = new Event('needJPushId');
                document.dispatchEvent(needJPushId);
            }
            callback(err, res);
        });
}

function initAPI($window, $location, $ionicPopup){
    var API = require('common/api');
    API.require('auth');
    API.authenticate = apiAuth;
    API.onlogin(gotoLogin);

    if(/^\/login\//.test($location.path())) return;
    if(/^\/finance\//.test($location.path())) return;
    var datastr = getAuthData();
    if(!datastr) {
        gotoLogin(true);
    }

    async function gotoLogin(direct?: boolean) {
        if(!direct){
            await $ionicPopup.alert({
                title: '登录已失效',
                template: '<div style="text-align: center;">将返回重新登录</div>'
            });
        }
        var backUrl = $location.absUrl();

        if(/^\/login\//.test($location.path())) {
            console.info("login page...");
            window.location.reload();
            return;
        }

        var API = require('common/api');
        var browserspec = require('browserspec');
        if(browserspec.is_wechat && /^[tj]\.jingli365\.com$/.test($location.host())) {
            let args = $location.search();
            if(!args.wxauthcode || !args.wxauthstate) {
                await API.onload();
                let url = await API.auth.getWeChatLoginUrl({redirectUrl: backUrl});
                $window.location.href = url;
                return;
            }
        }
        $location.path('/login/').search('backurl', backUrl);
    }
}

function initKeyboard($ionicPlatform, $ionicHistory, $rootScope, $window, $location, IONIC_BACK_PRIORITY) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if(window.cordova && window.cordova.plugins && window.cordova.plugins['Keyboard']) {
            let Keyboard = cordova.plugins['Keyboard'];
            Keyboard.hideKeyboardAccessoryBar(true);
            Keyboard.disableScroll(true);
        }

        $rootScope.ionicGoBack = function () {
            let viewHistory = $ionicHistory.viewHistory();
            let backView = viewHistory.backView;
            if (!backView) {
                $window.history.go(-1);
            } else if (backView.url) {
                //$location.replace();
                $location.url(backView.url);
            } else {
                backView.go();
            }
        }
        for(let k of Object.keys($ionicPlatform.$backButtonActions)) {
            let act = $ionicPlatform.$backButtonActions[k];
            if(act.fn.name == 'onHardwareBackButton') {
                delete $ionicPlatform.$backButtonActions[k];
                break;
            }
        }
        //$ionicPlatform.$backButtonActions = {};
        function onHardwareBackButton(e) {
            var backView = $ionicHistory.backView();
            if (backView) {
                $rootScope.$apply(()=>{
                    $rootScope.ionicGoBack();
                });
            } else {
                // there is no back view, so close the app instead
                ionic.Platform.exitApp();
            }
            e.preventDefault();
            return false;
        }
        $ionicPlatform.registerBackButtonAction(
            onHardwareBackButton,
            IONIC_BACK_PRIORITY.view
        );

    });
}
function initStatusBar($ionicPlatform, $rootScope) {
    $ionicPlatform.ready(function() {
        if(window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
            if(ionic.Platform.isIOS()){
                $rootScope.$on('$ionicSideMenuOpen', function(){
                    StatusBar.hide();
                });
                $rootScope.$on('$ionicSideMenuClose', function(){
                    StatusBar.show();
                });
            }
        }
    });
}
function initUpdater($ionicPlatform, $ionicPopup) {
    $ionicPlatform.ready(function() {
        window['bundle_url'] = cordova.file.applicationDirectory + 'www/';
        var el = $('<script manifest="' + window['bundle_url'] + 'manifest.json" timeout="10000"></script>');
        $('head').append(el);
        var dyload = require('dyload');
        dyload('script/libs/bundle.update.js')
            .then(function() {
                var updater = require('common/client/updater');
                updater.initUpdater(function(appLoader) {
                    $ionicPopup.confirm({
                        title: '有更新',
                        template: '是否更新?'
                    }).then(function(value) {
                        if(!value)
                            return;
                        location.href = window['bundle_url'] + 'update.html';
                    })
                })
            });
    })
}
// function initStatistics($ionicPlatform, $rootScope, statistics) {
//     $ionicPlatform.ready(function(){
//         $rootScope.$on('$stateChangeSuccess', function(){
//             statistics.$resolve();
//             statistics.trigger();
//         })
//     })
// }
    function initCNZZ($ionicPlatform,$rootScope,$location,CNZZ){
       $ionicPlatform.ready(function(){
           $rootScope.$on('$locationChangeSuccess',function(event,newUrl,oldUrl){
               var url = $location.path();
               let reg = /\/[a-zA-Z-]*\/index$/i;
               let ret = reg.test(url);
               if(ret){
                   url = url.substring(url.length-6,6);
               }
                var titles = {
                    "/staff/index" : "进入个人中心",
                    "/staff/staff-info" : "修改个人资料",
                    "/staff/bind-suppliers" : "绑定第三方账户",
                    "/trip/create" : "进入我要出差",
                    "/trip/budget" : "计算预算",
                    "/trip/special-approve" : "进入特别审批",
                    "/trip-approval/pending" : "进入审批单",
                    "/trip-approval/detail" : "撤销申请单",
                    "/trip/list" : "进入我的行程",
                    "/supplier/edit" : "新增自定义服务商",
                    "/invoice/invoice-detail" :"票据详情页",
                    "/trip/reserve" : "访问服务商",
                    "/trip/select-supplier" : "关联订单",
                    "/trip/list-detail" : "撤销行程",
                    "/trip-approval/list" : "进入出差请示",
                    "/manage/index" : "进入管理企业",
                    "/statistics/index" : "进入差旅统计",
                    "/trip/list-all" : "查看员工出差记录",
                    "/statistics/distribution" : "查看员工分布地图",
                    "/department/index" : "进入员工管理",
                    "/department/add-staff" : "点击邀请员工",
                    "/travel-policy/editpolicy" : "新增差旅标准",
                    "/travel-policy/showpolicy" : "差旅标准详情页",
                    "/travel-policy~2F" : "保存差旅标准",
                    "/travel-policy/index" : "修改差旅标准",
                    "/supplier/index" : "进入预订服务管理",
                    "/accord-hotel/index" : "进入协议酒店管理",
                    "/accord-hotel/edit" : "新增协议酒店城市",
                    "/manage/approve-set" : "审批设置",
                    "/login/index" : "退出登录",
                };
                if(!titles[url]){
                    CNZZ.addEvent(url,'URL', newUrl ,oldUrl);
                }
               CNZZ.addEvent(titles[url],'URL', newUrl ,oldUrl);
           })
       })
    }

require('nglibs');
require('www/libs');
var ngapp = require('ngapp');
ngapp.depend('ionic');
ngapp.depend('nglibs');
ngapp.depend('chart.js');
ngapp.depend('hmTouchEvents');
ngapp.root('ionic', '/staff/index');
ngapp.useRoutePolicy(ngapp.RoutePolicy.None);
ngapp.routeAddSingle('login');
ngapp.routeAddSingle('guide');
ngapp.routeAddSingle('finance');
ngapp.routePushEmbed('');
ngapp.routePopEmbed();
var app = ngapp.create('qm.ionic');
app.config(function($ionicConfigProvider){
    $ionicConfigProvider.views.maxCache(0);
});
app.run(initAPI);
app.run(initKeyboard);
app.run(initStatusBar);
// app.run(initStatistics);
app.run(initCNZZ);

if(window.cordova) {
    app.run(initUpdater);
    app.run(initJPush);
}
