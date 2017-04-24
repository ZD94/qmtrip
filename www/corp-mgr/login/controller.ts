/**
 * Created by wlh on 2017/2/14.
 */

'use strict';
import {signToken} from "_types/auth/auth-cert";
const API = require("@jingli/dnode-api");

export async function IndexController($scope, $stateParams) {
    $scope.errorMsg = '';
    let backurl = $stateParams.backurl;
    let authstr = $stateParams.authstr;
    if (authstr) {
        $scope.errorMsg = '自动登录中...';
    }

    if (authstr) {
        if (!backurl) {
            backurl = '#/index/index';
        }

        API.require("auth");
        await API.onload();
        let data: any = new Buffer(authstr, 'base64').toString('utf-8');
        let tokenObj: {tokenId: string, accountId: string, token: string} = JSON.parse(data);
        let signDate = new Date();
        let sign = signToken(tokenObj.accountId, tokenObj.tokenId, tokenObj.token, signDate);
        let ret = await API.auth.authentication({timestamp: signDate.valueOf(), sign: sign, tokenId: tokenObj.tokenId});
        if (!ret) {
            $scope.errorMsg = `链接已经失效或者不存在`;
        } else {
            //存储登录凭证
            await localStorage.setItem('auth_data', data);
            API.reload_all_modules();
            window.location.href = backurl;
        }
    } else {
        $scope.errorMsg = '暂时不支持用户名密码登录!';
    }
}