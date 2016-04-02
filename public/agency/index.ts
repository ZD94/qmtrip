
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
window['TLDAlert'] = TLDAlert;
function TLDAlert(msg) {
    var notie = require("notie");
    notie.alert(3, msg, 2);
}

var ngapp = require('ngapp');
ngapp.depend('qmmodel');
ngapp.initializer(require('nglibs'));
var app = ngapp.create('qm.agency');

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/companyList/CompanyList');
    $stateProvider
        .state("login", {
            url: "/login/:path",
            controllerProvider: ngapp.controllerProvider,
            resolve: {
                ctrl: function ($injector, $stateParams){
                    $stateParams.path = 'login/' + $stateParams.path;
                    return $injector.invoke(ngapp.controllerResolver, this, {$stateParams:$stateParams});
                }
            },
            templateUrl: function (params) {
                return '/agency/' + params.path + ".html";
            }
        })
        .state("root", {
            url: "",
            abstract: true,
            controllerProvider: ngapp.controllerProvider,
            resolve: { ctrl: ngapp.controllerResolver },
            templateUrl: function (params) {
                return '/agency/index.html';
            }
        })
        .state("root.content", {
            url: "/*path",
            controllerProvider: ngapp.controllerProvider,
            resolve: { ctrl: ngapp.controllerResolver },
            templateUrl: function (params) {
                return '/agency/' + params.path + ".html";
            }
        });
});