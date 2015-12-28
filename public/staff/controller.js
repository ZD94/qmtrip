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
                    $scope.$apply();
                })
                .catch(function (err) {
                    console.info(err)
                });
        });
        $scope.logout = function () {
            if (!API.auth)
                return;
            API.auth.logout()
                .then(function (ret) {
                    window.location.href = "/staff.html#/auth/login?backurl=" + encodeURIComponent(window.location.href);
                })
                .catch(function (err) {
                    console.info(err)
                })
        };
    }
    return staff;
})();
