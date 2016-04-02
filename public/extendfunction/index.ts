
var Cookie = require('tiny-cookie');
var API = require('api');
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
}

var ngapp = require('ngapp');
ngapp.depend('qmmodel');
ngapp.root('extendfunction', '/feedback');
ngapp.initializer(require('nglibs'));
var app = ngapp.create('tulingdao.com');

//获取页面基本信息
app.controller("MainController", ["$scope", function($scope) {
    API.require("company");
    API.require("staff");
    var companyId;
    API.onload(function(){
        API.staff.getCurrentStaff()
            .then(function(ret){
                $scope.staff = ret;
            })
            .catch(function(err){
                TLDAlert(err);
            })
    })
}])

$(function(){
    $(window).resize(function(){resize();})
    function resize(){
        var ww = $(window).width();
        $(".corp_m_header").css("width",ww-200);
    }
    resize();
    $()
})