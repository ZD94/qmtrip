require("ionic");

var Cookie = require('tiny-cookie');
var API = require('common/api');
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
        function(err, remote) {
            if (!err) window['current_agent_id'] = agent_id;
            callback(err, remote);
        });
};

//统一弹出框样式
window['TLDAlert'] = agency_TLDAlert;
function agency_TLDAlert(msg) {
    var notie = require("notie");
    notie.alert(3, msg, 2);
}

require('nglibs');

var ngapp = require('ngapp');
ngapp.depend('ionic');
ngapp.depend('nglibs');
ngapp.root('agency', '/companyList/CompanyList');
ngapp.useRoutePolicy(ngapp.RoutePolicy.Embed, ['login']);
var app = ngapp.create('qm.agency');

var dyload = require('dyload');