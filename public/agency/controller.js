"use strict";

module.exports = (function(){
    var agency = {};
    API.require("auth");
    agency.IndexController = function($scope) {
        API.require("agency", function (err, mod) { //API.require 使用回调函数时,不会导致页面跳转登录
            if (err || !mod) {
                TLDAlert(err);
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
                        TLDAlert(err.msg || err);
                    })
            });
        $scope.logout = function () {
            if (!API.auth)
                return;
            API.auth.logout()
                .done(function() {
                    window.location.href = "#/login/login";
                })
            };
        })
    }
    return agency;
})();
