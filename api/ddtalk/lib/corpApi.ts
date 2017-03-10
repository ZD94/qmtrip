/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import {CorpAccessToken} from "./interface";
import {reqProxy} from "./reqProxy";
import RedisCache = require('./redisCache');
import {DdTalkDepartment} from "./type";

export interface CorpTicket {
    ticket: string;
    expire_at: number;
}

export default class CorpApi {

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

    async getUserInfoByOAuth(code) : Promise<any> {
        let url = `https://oapi.dingtalk.com/user/getuserinfo?access_token=${this.accessToken.access_token}&code=${code}`;
        return reqProxy(url, {
            name: '通过code换取用户信息',
            method: 'GET'
        }).then( async (ret: any) => {
            if (ret.errrcode) throw new Error(ret);
            return {userId: ret.userid, deviceId: ret.deviceId, isSys: ret.is_sys, sysLevel: ret.sys_level}
        })
    }

    async getDepartments() :Promise<Array<DdTalkDepartment>> {
        let url = `https://oapi.dingtalk.com/department/list?access_token=${this.accessToken.access_token}`;
        return reqProxy(url, {
            name: '获取部门列表',
            method: 'GET',
            lang: 'zh_CN',
        }).then( async (ret: any) => {
            if (ret.errcode) throw new Error(JSON.stringify(ret));
            return ret.department;
        })
    }

    async getUserListByDepartment(departmentId): Promise<Array<any>> {
        let url = `https://oapi.dingtalk.com/user/list?access_token=${this.accessToken.access_token}&department_id=${departmentId}&lang=zh_CN`;
        let hasMore = true;
        let users: Array<any> = [];
        while(hasMore) {
            let result: any = await reqProxy(url, {
                method: 'GET',
                lang: 'zh_cn',
                name: '通过部门获取用户列表',
            })
            if (result.errcode) throw new Error(JSON.stringify(result));
            hasMore = result.hasMore;
            result.userlist.forEach( (u) => {
                users.push(u);
            })
        }
        return users;
    }

    async sendNotifyMsg(msg) {
        let url = `https://oapi.dingtalk.com/message/send?access_token=${this.accessToken.access_token}`;
        let result = await reqProxy(url, {
            name: '发送消息',
            method: 'POST',
            body: msg,
        })
        return result;
    }

    async getDepartmentInfo(departmentId): Promise<any> {
        let url = `https://oapi.dingtalk.com/department/get?access_token=${this.accessToken.access_token}&id=${departmentId}&lang=zh_CN`;
        let result = await reqProxy(url, {
            name: '获取部门详情',
            method: 'GET',
            lang: 'zh_CN'
        });
        return result;
    }

    async registryContractChangeLister(token: string, aesKey:string, eventListenUrl: string) {
        let self = this;
        let url = `https://oapi.dingtalk.com/call_back/register_call_back?access_token=${self.accessToken.access_token}`;
        let body = {
            "call_back_tag": ["user_add_org", "user_modify_org", "user_leave_org"  ,
                "org_dept_create" ,
                "org_dept_modify" ,
                "org_dept_remove"
            ],
            "token": token,
            "aes_key": aesKey,
            "url": eventListenUrl,
        }
        let result = await reqProxy(url, {
            name: '注册通讯录变更监听',
            method: 'POST',
            lang: 'zh_CN',
            body: body,
            json: true,
        });
        return result;
    }
}

