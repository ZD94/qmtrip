"use strict";

module.exports = (function(){
    var agency = {};
    API.require("auth");
    agency.IndexController = function($scope) {
        API.require("agency", function (err, mod) { //API.require 使用回调函数时,不会导致页面跳转登录
            if (err || !mod) {
                //console.log('load agency err:', err);
                return;
            }
            API.onload(function(){
                API.agency.getCurrentAgencyUser()
                    .then(function(ret){
                        // console.info(ret);
                        $scope.agency = ret;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info(err)
                    })
            });
        $scope.logout = function () {
            if (!API.auth)
                return;
            API.auth.logout()
                .then(function (ret) {
                    location.reload();
                    //window.location.href = "/agency.html#/login/login?backurl=" + encodeURIComponent(window.location.href);
                })
                .catch(function (err) {
                    console.info(err)
                })
            };
        })
    }
    return agency;
})();
