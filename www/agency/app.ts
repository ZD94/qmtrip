import L from 'common/language';
import { signToken } from '_types/auth/auth-cert';
import { getSession } from 'common/model';
require("ionic");

var API = require('common/api');
API.onlogin(function(){
    var backurl = window.location.href;
    backurl = encodeURIComponent(backurl);
    window.location.href = '#/login/login?backurl='+backurl;
});
API.authenticate = function(remote, callback){
    var datastr = localStorage.getItem('agency_auth_data');
    var data = JSON.parse(datastr);
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
            }
            callback(err, res);
        });
};

//统一弹出框样式
window['TLDAlert'] = agency_TLDAlert;
function agency_TLDAlert(msg) {
    var notie = require("notie");
    notie.alert(3, msg, 2);
}

require('nglibs');
require('www/libs');

var ngapp = require('ngapp');
ngapp.depend('ionic');
ngapp.depend('nglibs');
ngapp.root('agency', '/travelRecord/TravelList');
ngapp.useRoutePolicy(ngapp.RoutePolicy.Embed, ['login']);
var app = ngapp.create('qm.agency');

var dyload = require('dyload');