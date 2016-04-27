
var browserspec = require('browserspec');
browserspec.enum_wechat();

var Cookie = require('tiny-cookie');
var API = require('api');
API.onlogin(function(){
    var backUrl = window.location.href;
    backUrl = encodeURIComponent(backUrl);
    if(browserspec.is_wechat && /^qmtrip\.com\.cn$/.test(window.location.host)) {
        window.location.href = "/auth/wx-login?redirect_url=" + backUrl;
    }else {
        window.location.href = "#/auth/login?backurl="+backUrl;
    }
})
API.authenticate = function(remote, callback){
    var user_id = Cookie.get('user_id');
    var token_id = Cookie.get('token_id');
    var token_sign = Cookie.get('token_sign');
    var timestamp = Cookie.get("timestamp");
    remote.authenticate({ accountid: user_id, tokenid: token_id, timestamp: timestamp, tokensign: token_sign },
            callback);
};

//统一弹出框样式
window['TLDAlert'] = mobile_TLDAlert;
function mobile_TLDAlert(msg) {
    var notie = require("notie");
    notie.alert(3, msg, 2);
}

var ngapp = require('ngapp');
ngapp.depend('qm.common');
ngapp.depend('qm.model');
ngapp.root('mobile', '/usercenter/index');
ngapp.initializer(require('nglibs'));
ngapp.useRoutePolicy(ngapp.RoutePolicy.None);
ngapp.routePushEmbed('tab');
ngapp.routeNamedEmbed('tab-dash');
ngapp.routeNamedEmbed('tab-chats');
ngapp.routePopEmbed();
ngapp.routeAddSingle('');
var app = ngapp.create('qm.mobile');
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

dyload('/script/libs/bundle.swiper.js');
dyload('http://res.wx.qq.com/open/js/jweixin-1.0.0.js');
dyload('/script/selectbox.js');
