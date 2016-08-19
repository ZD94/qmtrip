
import * as L from 'common/language';
import { getSession } from 'common/model';
require('ionic');

function getAuthData() {
    return localStorage.getItem('auth_data');
}

window['getAuthDataStr'] = function() {
    let authData: any = getAuthData();
    if(typeof authData == 'string') {
        authData = JSON.parse(authData);
    }
    let strs: any = [];
    for(var k in authData) {
        strs.push(k + '=' + authData[k]);
    }
    strs = strs.join("&");
    return strs;
}

function apiAuth(remote, callback) {
    var datastr = getAuthData();
    if(!datastr) {
        return callback(L.ERR.NEED_LOGIN, remote);
    }
    var data;
    try {
        data = JSON.parse(datastr);
    } catch(e) {
        return callback(e, remote);
    }
    remote.authenticate({
            accountid: data.user_id,
            tokenid: data.token_id,
            timestamp: data.timestamp,
            tokensign: data.token_sign
        },
        function(err, handle) {
            if(!err) {
                var session = getSession();
                session.accountId = data.user_id;
                session.token = {
                    id: data.token_id,
                    sign: data.token_sign,
                    timestamp: data.timestamp
                };
            }
            callback(err, handle);
        });
}

function initAPI($window, $location, $ionicPopup){
    var API = require('common/api');
    API.require('auth');
    API.authenticate = apiAuth;
    API.onlogin(gotoLogin);

    if(/^\/login\//.test($location.path()))
        return;
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

function initKeyboard($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if(window.cordova && window.cordova.plugins && window.cordova.plugins['Keyboard']) {
            let Keyboard = cordova.plugins['Keyboard'];
            Keyboard.hideKeyboardAccessoryBar(true);
            Keyboard.disableScroll(true);
        }
    });
}
function initStatusBar($ionicPlatform) {
    $ionicPlatform.ready(function() {
        if(window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
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

require("angular-chart.js")
require('nglibs');
var ngapp = require('ngapp');
ngapp.depend('ionic');
ngapp.depend('nglibs');
ngapp.depend('chart.js');
ngapp.root('ionic', '/trip/create');
ngapp.useRoutePolicy(ngapp.RoutePolicy.None);
ngapp.routeAddSingle('login');
ngapp.routePushEmbed('');
ngapp.routePopEmbed();
var app = ngapp.create('qm.ionic');
app.config(function($ionicConfigProvider){
    $ionicConfigProvider.views.maxCache(0);
});
app.run(initAPI);
app.run(initKeyboard);
app.run(initStatusBar);
if(window.cordova) {
    app.run(initUpdater);
}
