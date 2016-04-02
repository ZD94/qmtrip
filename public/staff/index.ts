
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
ngapp.depend('qmmodel');
ngapp.initializer(require('nglibs'));
var app = ngapp.create('qmtrip.staff');

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/StaffFirst/StaffUser');
    $stateProvider
        .state("auth", {
            url: "/auth/:path",
            controllerProvider: ngapp.controllerProvider,
            resolve: {
                ctrl: function ($injector, $stateParams){
                    $stateParams.path = 'auth/' + $stateParams.path;
                    return $injector.invoke(ngapp.controllerResolver, this, {$stateParams:$stateParams});
                }
            },
            templateUrl: function (params) {
                return '/staff/auth/' + params.path + ".html";
            }
        })
        .state("root", {
            url: "",
            abstract: true,
            controllerProvider: ngapp.controllerProvider,
            resolve: { ctrl: ngapp.controllerResolver },
            templateUrl: function (params) {
                if (isAuthCreditExist()) {
                    return '/staff/index.html';
                }
                return '/staff/auth/login.html';
            }
        })
        .state("root.content", {
            url: "/*path",
            controllerProvider: ngapp.controllerProvider,
            resolve: { ctrl: ngapp.controllerResolver },
            templateUrl: function (params) {
                if (isAuthCreditExist()) {
                    return '/staff/' + params.path + ".html";
                }
                return '/staff/auth/login.html';
            }
        });
});