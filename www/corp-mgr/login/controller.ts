/**
 * Created by wlh on 2017/2/14.
 */

'use strict';
const API = require("common/api");

export async function LoginController($scope, $stateParams) {
    $scope.showAutoLoginMsg = false;
    $scope.errorMsg = 'sorry, 登录失败!';
    let backurl = $stateParams.backurl;
    let authstr = $stateParams.authstr;
    if (authstr) {
        $scope.showAutoLoginMsg = true;
    }

    if (authstr) {
        if (!backurl) {
            backurl = '#/index/index';
        }
        API.require("auth");
        await API.onload();
        let data = new Buffer(authstr, 'base64').toString('utf-8');
        await localStorage.setItem('auth_data', data);
        API.reload_all_modules();
        window.location.href = backurl;
    }
}

export async function IndexController($scope, $stateParams) {

}