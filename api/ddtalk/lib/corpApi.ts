/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import {CorpAccessToken} from "./interface";
import {reqProxy} from "./reqProxy";
import RedisCache = require('./redisCache');

interface CorpTicket {
    ticket: string;
    expire_at: number;
}

class CorpApi {

    private cache: RedisCache;

    constructor(public corpid: string, public accessToken: CorpAccessToken) {
        this.cache = new RedisCache();
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

    async getTicket() : Promise<CorpTicket> {
        let key = `corp_ticket_token:${this.corpid}`;
        let self = this;
        let ticketObj: any = await self.cache.get(key)
        if (ticketObj && ticketObj.expire_at > Date.now()) {
            return ticketObj;
        }
        let url = `https://oapi.dingtalk.com/get_jsapi_ticket?access_token=${this.accessToken.access_token}`
        return reqProxy(url, {
            name: '获取ticket',
            method: 'GET'
        }).then( async (ret: any) => {
            if (ret.errcode) throw new Error(ret);
            let expire_at = Date.now() + (ret.expires_in - 30) * 1000;
            ticketObj = {ticket: ret.ticket, expire_at: expire_at}
            await self.cache.set(key, ticketObj);
            return ticketObj;
        })
    }

    async getUserInfoByOAuth(code) : any {
        let url = `https://oapi.dingtalk.com/user/getuserinfo?access_token=${this.accessToken.access_token}&code=${code}`;
        return reqProxy(url, {
            name: '通过code换取用户信息',
            method: 'GET'
        }).then( async (ret: any) => {
            if (ret.errrcode) throw new Error(ret);
            return {userId: ret.userid, deviceId: ret.deviceId, isSys: ret.is_sys, sysLevel: ret.sys_level}
        })
    }
}

export= CorpApi