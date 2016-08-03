
import * as L from 'common/language';
import { getSession } from 'common/model';
require('ionic');
var API = require('common/api');
API.require('auth');

var browserspec = require('browserspec');
// browserspec.enum_wechat();

var Cookie = require('tiny-cookie');
var API = require('common/api');
API.onlogin(async function(){
    var backUrl = window.location.href;

    if(/^http\:\/\/.*\/(index.html)?\#\/login\/(index)?\?backurl\=.*/.test(backUrl)) {
        console.info("login page...");
        window.location.reload();
        return;
    }

    if(browserspec.is_wechat && /.*jingli365\.com/.test(window.location.host)){
        if(!/.*wxauthcode\=\w*\&wxauthstate\=.*/.test(backUrl)) {
            await API.onload();
            let url = await API.auth.getWeChatLoginUrl({redirectUrl: backUrl});
            window.location.href = url;
            return;
        }
    }else {
        backUrl = encodeURIComponent(backUrl);
        window.location.href = "#/login/?backurl="+backUrl;
    }
});

function getAuthData() {
    return localStorage.getItem('auth_data');
}

window['getAuthDataStr'] = function() {
    let authData: any = getAuthData();
    if (typeof authData == 'string') {
        authData = JSON.parse(authData);
    }
    let strs: any = [];
    for(var k in authData) {
        strs.push(k+'='+authData[k]);
    }
    strs = strs.join("&");
    return strs;
}

API.authenticate = function(remote, callback){
    var datastr = getAuthData();
    if(!datastr){
        return callback(L.ERR.NEED_LOGIN, remote);
    }
    var data;
    try{
        data = JSON.parse(datastr);
    }catch(e){
        return callback(e, remote);
    }
    remote.authenticate({ accountid: data.user_id, tokenid: data.token_id, timestamp: data.timestamp, tokensign: data.token_sign },
            function(err, handle){
                if(!err){
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
};
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
app.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins['Keyboard']) {
            let Keyboard = cordova.plugins['Keyboard'];
            Keyboard.hideKeyboardAccessoryBar(true);
            Keyboard.disableScroll(true);

        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
});


var dyload = require('dyload');

if(browserspec.is_wechat) {
    dyload("http://res.wx.qq.com/open/js/jweixin-1.0.0.js")
}
