
import L from '@jingli/language';
import { getSession } from 'common/model';
import { signToken, LoginResponse, genAuthString } from '_types/auth/auth-cert';
var API = require("common/api");
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

function initAPI($window, $location){
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
            alert('登录已失效');
            return;
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
require("ionic");
require("nglibs");
var ngapp = require('ngapp');
ngapp.depend('nglibs');
ngapp.root('corp-mgr', '/index/index');
ngapp.useRoutePolicy(ngapp.RoutePolicy.None);
ngapp.routeAddSingle('login');
ngapp.routePushEmbed('');
ngapp.routePopEmbed();
var app = ngapp.create('qm.corp-mgr');
app.run(initAPI);
