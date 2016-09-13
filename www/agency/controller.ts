"use strict";
var API = require('common/api');
var msgbox = require('msgbox');

API.require("auth");

export function IndexController($scope) {
    API.require("agency", function(err, mod) { //API.require 使用回调函数时,不会导致页面跳转登录
        if(err || !mod) {
            msgbox.alert(err.msg ? err.msg : err);
            return;
        }
        API.onload(function() {
            API.agency.getAgencyUser({id: window['current_agent_id']})
                .then(function(ret) {
                    // console.info(ret);
                    $scope.agency = ret;
                })
                .catch(function(err) {
                    msgbox.alert(err.msg || err);
                })
        });

        $scope.logout = function() {
            API.onload(function() {
                API.auth.logout()
                    .done(function() {
                        window.location.href = "#/login/login";
                    })
            })
        }
    });
}
