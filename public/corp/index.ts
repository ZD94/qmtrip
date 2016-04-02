

var ngapp = require('ngapp');

var browserspec = require('browserspec');
browserspec.enum_wechat();

var Cookie = require('tiny-cookie');
var API = require('api');
API.onlogin(function(){
    var backUrl = window.location.href;
    backUrl = encodeURIComponent(backUrl);
    window.location.href = "/staff.html#/auth/login?backurl="+backUrl;
});
API.authenticate = function(remote, callback){
    var user_id = Cookie.get('user_id');
    var token_id = Cookie.get('token_id');
    var token_sign = Cookie.get('token_sign');
    var timestamp = Cookie.get("timestamp");
    remote.authenticate({ accountid: user_id, tokenid: token_id, tokensign: token_sign, timestamp: timestamp },
        callback);
};

//统一弹出框样式
window['TLDAlert'] = TLDAlert;
function TLDAlert(msg) {
    var notie = require("notie");
    notie.alert(3, msg, 2);
    console.error(msg);
}

window['logout'] = logout;
function logout(){
    API.require('auth');
    API.onload(function(){
        API.auth.logout()
            .done(function() {
                Cookie.remove("user_id");
                Cookie.remove("token_id");
                Cookie.remove("token_sign");
                Cookie.remove("timestamp");
                window.location.href = "/staff.html#/auth/login";
            });
    });
};

ngapp.depend('qmmodel');
ngapp.root('corp', '/UsersFirst/UserMain');
ngapp.initializer(require('nglibs'));
var app = ngapp.create('qm.corp');

//获取页面基本信息
app.controller("MainController", ["$scope", function($scope) {
    API.require("company");
    API.require("staff");
    var companyId;
    API.onload(function(){
        API.staff.getCurrentStaff()
            .then(function(ret){
                $scope.staff = ret;
                var company_id = ret.companyId;
                companyId = company_id;
                return API.company.getCompanyById(company_id)
                    .then(function(company){
                        $scope.company = company;
                        var companyName = company.name;
                        if (companyName.length>30) {
                            $scope.companyName = companyName.substr(0,29) + '…';
                        }else{
                            $scope.companyName = companyName;
                        }
                    })
            })
            .catch(function(err){
                TLDAlert(err);
            })
    })
}])

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
if (!isAuthCreditExist()) {
    window.location.href = "/staff.html#/auth/login?backurl="+window.location.href;
}

$(function(){
    $(window).resize(function(){resize();})
    $(".left_nav a").click(function(){
        var $that = $(this).closest("li");
        $(".left_nav li").removeClass("on");
        $that.addClass("on");
    })
    function resize(){
        var ww = $(window).width();
        $(".corp_m_header").css("width",ww-200);
    }
    resize();
    $()
})

