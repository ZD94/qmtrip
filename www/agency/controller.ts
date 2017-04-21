"use strict";
import { AgencyUser } from '_types/agency/agency-user';
var API = require('@jingli/dnode-api');
var msgbox = require('msgbox');

API.require("auth");

export function IndexController($scope) {
    API.require("agency", async function(err, mod) { //API.require 使用回调函数时,不会导致页面跳转登录
        if(err || !mod) {
            msgbox.alert(err.msg ? err.msg : err);
            return;
        }
        await API.onload();
        var user = await AgencyUser.getCurrent();
        $scope.agency = user;

        $scope.logout = async function() {
            await API.onload();
            await API.auth.logout();
            window.location.href = "#/login/login";
        }
    });
}
