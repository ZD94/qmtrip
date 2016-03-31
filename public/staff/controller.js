"use strict";

module.exports = (function(){
    var staff = {};
    API.require("auth");
    staff.IndexController = function($scope) {
        API.require("staff", function (err, mod) { //API.require 使用回调函数时,不会导致页面跳转登录
            if (err || !mod) {
                //console.log('load staff err:', err);
                return;
            }
            API.staff.getCurrentStaff()
                .then(function (ret) {
                    $scope.staff = ret;
                })
                .catch(function (err) {
                    TLDAlert(err.msg || err)
                });
        });
        $scope.logout = function () {
            if (!API.auth)
                return;
            API.auth.logout()
                .then(function (ret) {
                    //location.reload();
                    window.location.href = "/staff.html#/auth/login";
                    //window.location.href = "/staff.html#/auth/login?backurl=" + encodeURIComponent(window.location.href);
                })
                .catch(function (err) {
                    TLDAlert(err.msg || err)
                    //location.reload();
                })
        };

        $scope.feedback = function() {
            window.open( "/extendfunction.html#/feedback/feedback");
        }
    }
    return staff;
})();
