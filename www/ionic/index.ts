
import * as L from 'common/language';
import { getSession } from 'common/model';
require('ionic');

var browserspec = require('browserspec');
// browserspec.enum_wechat();

var Cookie = require('tiny-cookie');
var API = require('common/api');
API.onlogin(function(){
    var backUrl = window.location.href;

    if(/^http\:\/\/.*\/(index.html)?\#\/login\/(index)?\?backurl\=.*/.test(backUrl)) {
        window.location.reload();
        return;
    }
    backUrl = encodeURIComponent(backUrl);
    window.location.href = "#/login/?backurl="+backUrl;
});

API.authenticate = function(remote, callback){
    var datastr = localStorage.getItem('auth_data');
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
let ngBaiduMap = require('angular-baidu-map').ngBaiduMap;
require("angular-chart.js")
require('nglibs');
var ngapp = require('ngapp');
ngapp.depend('ionic');
ngapp.depend('nglibs');
ngapp.depend(ngBaiduMap);
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
