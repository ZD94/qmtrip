/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import {CorpAccessToken} from "./interface";
import {reqProxy} from "./reqProxy";

class CorpApi {

    constructor(public accessToken: CorpAccessToken) {
    }

    async departmentList() {
        let url = `https://oapi.dingtalk.com/department/list?access_token=${this.accessToken.access_token}`;
        return reqProxy(url, {
            method: 'GET',
            name: '获取部门列表',
        });
    }

    async getAdmin() {
        let url = `https://oapi.dingtalk.com/user/get_admin?access_token=${this.accessToken.access_token}`;
        return reqProxy(url, {
            name: '获取管理员列表',
            method: 'GET'
        })
    }

    async getUser(userid) {
        let url = `https://oapi.dingtalk.com/user/get?access_token=${this.accessToken.access_token}`
        return reqProxy(url, {
            name: '获取用户基本信息',
            qs: {
                userid: userid,
            },
            method: 'GET'
        });
    }
}

export= CorpApi