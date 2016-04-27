
var Cookie = require('tiny-cookie');
var API = require('api');
API.onlogin(function(){
    var backurl = window.location.href;
    backurl = encodeURIComponent(backurl);
    window.location.href = '/agency.html#/login/login?backurl='+backurl;
});
API.authenticate = function(remote, callback){
    var agent_id = Cookie.get('agent_id');
    var token_id = Cookie.get('agent_token_id');
    var token_sign = Cookie.get('agent_token_sign');
    var timestamp = Cookie.get("agent_token_timestamp");
    remote.authenticate({ accountid: agent_id, tokenid: token_id, tokensign: token_sign, timestamp: timestamp },
        callback);
};

//统一弹出框样式
window['TLDAlert'] = agency_TLDAlert;
function agency_TLDAlert(msg) {
    var notie = require("notie");
    notie.alert(3, msg, 2);
}

var ngapp = require('ngapp');
ngapp.depend('qm.model');
ngapp.root('agency', '/companyList/CompanyList');
ngapp.initializer(require('nglibs'));
ngapp.useRoutePolicy(ngapp.RoutePolicy.Embed, ['login']);
var app = ngapp.create('qm.agency');

var dyload = require('dyload');
dyload('/script/selectbox.js');
dyload('/script/header.js');
dyload('/script/jquery.ajaxfileupload.js');
dyload('/script/jqPaginator.js');
dyload('/script/messagebox.js');
        