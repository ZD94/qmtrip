
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
window['TLDAlert'] = TLDAlert;
function TLDAlert(msg) {
    var notie = require("notie");
    notie.alert(3, msg, 2);
}

var ngapp = require('ngapp');
ngapp.depend('qmmodel');
ngapp.root('mobile', '/usercenter/index');
ngapp.initializer(require('nglibs'));
var app = ngapp.create('qm.mobile');

var dyload = require('dyload');

dyload('/script/libs/bundle.swiper.js');
dyload('http://res.wx.qq.com/open/js/jweixin-1.0.0.js');
dyload('/script/selectbox.js');
