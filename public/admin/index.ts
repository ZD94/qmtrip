
var Cookie = require('tiny-cookie');
var API = require('api');
API.onlogin(function(){
    var backUrl = window.location.href;
    backUrl = encodeURIComponent(backUrl);
    window.location.href = "/admin.html#/auth/login?backurl="+backUrl;
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
window['TLDAlert'] = admin_TLDAlert;
function admin_TLDAlert(msg) {
    var notie = require("notie");
    notie.alert(3, msg, 2);
}

window['logout'] = admin_logout;
function admin_logout(){
    API.require('auth');
    API.onload(function(){
        API.auth.logout()
            .then(function (data) {
                location.reload();
            }).catch(function(error){
            console.log(error);
        }).done();
    });
};

require('nglibs');

var ngapp = require('ngapp');
ngapp.depend('nglibs');
ngapp.root('admin', '/main/index');
var app = ngapp.create('qm.admin');

//获取页面基本信息
app.controller("MainController", ["$scope", function($scope) {
    API.require("company");
    API.require("staff");
    API.onload(function(){
        API.staff.getCurrentStaff()
            .then(function(ret){
                $scope.staff = ret;
                var company_id = ret.companyId;
                API.company.getCompanyById(company_id)
                    .then(function(company){
                        $scope.company = company;
                        var companyName = company.name;
                        if (companyName.length>30) {
                            $scope.companyName = companyName.substr(0,29) + '…';
                        }else{
                            $scope.companyName = companyName;
                        }
//		    					console.info(company);
                    })
                    .catch(function(err){
                        console.info(err)
                    })
            })
            .catch(function(err){
                console.info(err)
            })
    })
}])

var dyload = require('dyload');
dyload('http://echarts.baidu.com/build/dist/echarts-all.js');
dyload('/script/messagebox.js');
dyload('/script/selectbox.js');
dyload('/script/header.js');
dyload('/script/jquery.ajaxfileupload.js');
        
$(function(){
    $(window).resize(function(){resize();})
    $(".left_nav a").click(function(){
        var $that = $(this).closest("li");
        $(".left_nav li").removeClass("on");
        $that.addClass("on");
//    		console.info($that)
    })
    function resize(){
        var ww = $(window).width();
        $(".corp_m_header").css("width",ww-200);
    }
    resize();
})
