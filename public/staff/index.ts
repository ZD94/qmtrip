
var Cookie = require('tiny-cookie');
var API = require('api');
API.onlogin(function () {
    var backUrl = window.location.href;
    backUrl = encodeURIComponent(backUrl);
    window.location.href = "/staff.html#/auth/login?backurl=" + backUrl;
});
API.authenticate = function(remote, callback){
    var user_id = Cookie.get('user_id');
    var token_id = Cookie.get('token_id');
    var token_sign = Cookie.get('token_sign');
    var timestamp = Cookie.get("timestamp");

    remote.authenticate({ accountid: user_id, tokenid: token_id, tokensign: token_sign, timestamp: timestamp },callback);
};

//统一弹出框样式
window['TLDAlert'] = TLDAlert;
function TLDAlert(msg) {
    var notie = require("notie");
    notie.alert(3, msg, 2);
}

function isAuthCreditExist() {
    var user_id = Cookie.get('user_id');
    var token_id = Cookie.get('token_id');
    var token_sign = Cookie.get('token_sign');
    var timestamp = Cookie.get("timestamp");

    if (user_id && token_id && token_sign && token_id) {
        return true;
    }
    return false;
}

var ngapp = require('ngapp');
ngapp.depend('qm.model');
ngapp.root('staff', '/StaffFirst/StaffUser');
ngapp.initializer(require('nglibs'));
ngapp.useRoutePolicy(ngapp.RoutePolicy.Embed, ['auth']);
var app = ngapp.create('qm.staff');

var dyload = require('dyload');
dyload('/script/jquery.ajaxfileupload.js');
dyload('/script/jqPaginator.js');
dyload('/script/selectbox.js');
dyload('/script/header.js');
dyload('/script/messagebox.js');
