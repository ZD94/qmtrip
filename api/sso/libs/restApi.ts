import { WStaff, IWStaff } from "api/sso/libs/wechat-staff";
import { IWDepartment } from "api/sso/libs/wechat-department";
import { Express } from "express-serve-static-core";
var request = require("request-promise");
import cache from 'common/cache';

const enum EIteratorSwitch {
    ACCESS_ITERATABLE = 1,  //表示迭代获取
    ACCESS_NO_ITERATOR = 0  //不使用迭代获取，只获取当前
}


export class RestApi {

    access_token: string;
    constructor(access_token: string) {
        this.access_token = access_token;
    }

    /**
     * @method 使用永久授权码和套件访问令牌和corpid获取访问服务的access_token
     * @param corpId {string} 公司在企业微信中的id
     * @param permanentCode {string} 永久授权码
     * @param suiteAccessToken {string} 套件令牌
     */
    static async getAccessTokenByPermanentCode(corpId: string, permanentCode: string, suiteAccessToken: string) {
        let url = 'https://qyapi.weixin.qq.com/cgi-bin/service/get_corp_token?suite_access_token=' + suiteAccessToken
        const res = await reqProxy({
            url,
            method: 'POST',
            body: {
                auth_corpid: corpId,
                permanent_code: permanentCode
            }
        })
        if (res.errcode != 0)
            return null
        return {
            accessToken: res.access_token,
            expires_in: res.expires_in
        }
    }

    /**
     * @method 获取永久授权码
     * @param suiteToken {string} 套件令牌
     * @param authCode {string} 验证码
     * @return {Promise<IWPermanentCode>}
     */
    static async getPermanentCode(suiteToken: string, authCode: string): Promise<IWPermanentCode> {
        let url = `https://qyapi.weixin.qq.com/cgi-bin/service/get_permanent_code?suite_access_token=${suiteToken}`;
        let result: IWPermanentCodeResult = await reqProxy({
            url,
            method: 'POST',
            body: {
                auth_code: authCode
            }
        });
        if (typeof result == 'string')
            result = JSON.parse(result)
        console.log("=====>result: ", result)
        let corpName = result.auth_corp_info.corp_full_name;
        if(!corpName || corpName == '') corpName = result.auth_corp_info.corp_name;
        // if(result.errcode != 0) return null;
        return {
            accessToken: result.access_token,
            permanentCode: result.permanent_code,
            corpId: result.auth_corp_info.corpid,
            corpName: corpName,
            expires_in: result.expires_in,
            authUserInfo: {
                email: result.auth_user_info.email,
                mobile: result.auth_user_info.mobile,
                userId: result.auth_user_info.userid,
                name: result.auth_user_info.name,
                avatar: result.auth_user_info.avatar,
            }, 
            authInfo: {
                agentId:   result.auth_info && result.auth_info.agent && result.auth_info.agent.length ? result.auth_info.agent[0].agentid: null,
                appId: result.auth_info && result.auth_info.agent && result.auth_info.agent.length ? result.auth_info.agent[0].appid: null,            
                name: result.auth_info && result.auth_info.agent && result.auth_info.agent.length ? result.auth_info.agent[0].name: null,
            }
        } as IWPermanentCode;
    }


   

    /**
     * @method 根据suiteToken获取该公司的管理员列表
     * @param suiteToken {string} 套件令牌
     * @param agentId {string} 应用id
     */
    async getAdminList(corpId: string, agentId: string, suiteToken: string): Promise<Array<IWAdminList>> {
        let url = `https://qyapi.weixin.qq.com/cgi-bin/service/get_admin_list?suite_access_token=${suiteToken}`;
       
        let body = {
            auth_corpid: corpId,
            agentid: agentId
        }
        let result: IWAdminListResult = await reqProxy({
            url,
            method: 'POST',
            body
        });
        if (!result || result.errcode != 0)
            return null;
        return result.admin
    }

    /**
     * @method 根据corpid和secret获取该公司的access_token 
     *     不可用，无法获取微信企业的secret
     *   secret: x51OLfe5UWqI5VEW2nXg6tAph5P8kPqmJ_RxtgnbPBE
     */
    static async getAccessToken(corpid: string, secret: string): Promise<IAccessToken> {
        let url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret==${secret}`;
        // let url = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wwb398745b82d67068&corpsecret=x51OLfe5UWqI5VEW2nXg6tAph5P8kPqmJ_RxtgnbPBE'
        let result: IAccessToken = await reqProxy({
            url,
            method: 'GET'
        });
        if (result && result.errcode == 0)
            return result;
        return null;
    }

    /**根据该公司的access_token获取某个staff的信息 */
    async getStaff(userid?: string) {
        let url = `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${this.access_token}&userid=${userid}`;
        let result: IWStaffResult = await reqProxy({
            url,
            method: 'GET'
        });
        return {
            userid: result.userid,
            name: result.name,
            mobile: result.mobile,
            email: result.email,
            english_name: result.english_name,
            gender: result.gender,
            avatar_mediaid: result.avatar_mediaid,
            isleader: result.isleader,
            department: result.department,
            order: result.order,
            position: result.position,
            telephone: result.telephone,
            status: result.status,
            extattr: result.extattr
        } as IWStaff;
    }

    /**根据该公司的access_token更新某个staff的信息 */
    // async updateStaff(params?: WStaff){
    //     let url = `https://qyapi.weixin.qq.com/cgi-bin/user/update?access_token=${this.access_token}`;
    //     let result = await reqProxy({
    //         url,
    //         method: 'POST',
    //         body: params,
    //     });
    //     return result;
    // }


    /**
     * @method 根据该公司的access_token获取某个staff的信息 
     * @param.id {string} 可选， 获取指定部门及其子部门。若不填，默认获取全量组织架构
     * @return {IDepartmentResult}
     */
    async getDepartments(id?: string): Promise<Array<IWDepartment>> {
        let url = `https://qyapi.weixin.qq.com/cgi-bin/department/list`;
        let qs: { access_token: string, id?: string } = {
            access_token: this.access_token
        }
        if (id) qs['id'] = id;
        let result: IDepartmentResult = await reqProxy({
            url,
            method: 'GET',
            qs: qs
        });
        if (!result) return null;
        return result.department;
    }

    /**
     * @method 根据该公司的access_token获取部门成员信息
     * @param.departmentId {string} 部门id
     * @param.fetchChild {number} 0: 关闭递归获取子部门下面的成员 1: 递归获取所有部门成员
     * @return {IMemberListResult}
     */
    async getDetailedStaffsByDepartment(departmentId?: string, fetchChild?: number): Promise<Array<IWStaff>> {
        let url = 'https://qyapi.weixin.qq.com/cgi-bin/user/list';
        let qs: {
            access_token: string,
            department_id: string,
            fetch_child?: number
        } = {
                access_token: this.access_token,
                department_id: departmentId
            }
        if (fetchChild) qs.fetch_child = fetchChild;
        let result: IMemberListResult = await reqProxy({
            url,
            method: 'GET',
            qs
        });
        if (!result || !result.userlist)
            return null;
        return result.userlist;
    }

    /**
     * @method 根据该公司的access_token获取部门成员简单信息
     * @param.departmentId {string} 部门id
     * @param.fetchChild {number} 是否递归获取子部门下面的成员
     * @return {IConciseMemberListResult}
     */
    async getConciseStaffsByDepartment(departmentId?: string, fetchChild?: number): Promise<any> {
        let url = 'https://qyapi.weixin.qq.com/cgi-bin/user/simplelist';
        let qs: {
            access_token: string,
            department_id: string,
            fetch_child?: number
        } = {
                access_token: this.access_token,
                department_id: departmentId,
            }
        if (fetchChild) qs.fetch_child = fetchChild;
        let result: IConciseMemberListResult = await reqProxy({
            url,
            method: 'GET',
            qs
        });
        if (!result || !result.userlist) return null;
        return result.userlist;
    }

    static async getJsApiTicket(accessToken: string): Promise<string> {
        const ticket = await cache.read('jsapi-ticket')
        if (ticket) return ticket
        const result: JsApiTicket = await reqProxy({
            url: '',
            method: 'GET',
            qs: { access_token: accessToken }
        })
        if (!result || result.errcode != 0) return null
        await cache.write('jsapi-ticket', result.ticket, result.expires_in)
        return result.ticket
    }
}


async function reqProxy(params: {
    url: string,
    method: string,
    body?: any,
    qs?: any
}): Promise<any> {
    let { url, method, body = {}, qs = {} } = params;
    let result;
    let options
    try {
        result = await request({ url, method, body, qs, json: true });
    } catch (err) {
        if (err)
            throw new Error(err);
    }
    if (typeof result == 'string')
        result = JSON.parse(result);
    if (!result)
        return null;
    return result;
}



export interface IDepartmentResult {
    errcode?: number;
    errmsg?: string;
    department: Array<IWDepartment>
}

export interface IMemberListResult {
    errcode?: number;
    errmsg?: string;
    userlist: Array<IWStaff>
}

export interface IConciseMemberListResult {
    errcode?: number;
    errmsg?: string;
    userlist: Array<{
        userid: string;
        name: string;
        department: Array<number>
    }>
}

export interface IAccessToken {
    errcode: number;
    errmsg: string;
    access_token: string;
    expires_in: number;
}

export interface IWStaffResult extends IWStaff {
    errcode: number,
    errmsg: string
}


export interface IWPermanentCodeResult {
    errcode: number,
    errmsg: string,
    access_token: string;
    expires_in: number;
    permanent_code: string;
    auth_corp_info: {
        corpid: string,
        corp_name: string,
        corp_type: string,
        corp_square_logo_url: string,
        corp_full_name: string,
        corp_user_max: number,
        corp_agent_max: number,
        verified_end_time: number,
        subject_type: number,
        corp_wxqrcode: string
    },
    auth_info: {
        agent: any  //类型为IWAgent
    }
    auth_user_info: {
        email: string,
        mobile: string,
        userid: string,
        name: string,
        avatar: string
    }
}

export interface IWPermanentCode {
    accessToken: string,
    permanentCode: string,
    corpId: string,
    corpName: string,
    expires_in: number,
    authUserInfo: {
        email: string,
        mobile: string,
        userId: string,
        name: string,
        avatar: string
    },
    authInfo: {
        agentId: string,
        appId: string,
        name?: string
    }
}

export interface IWAgent {
    agentid: number,
    name?: string,
    round_logo_url?: string,
    square_logo_url?: string,
    appid: number,
    privilege?: {
        level?: number,
        allow_party?: Array<number>,
        allow_user?: Array<string>,
        allow_tag?: Array<number>,
        extra_party?: Array<number>,
        extra_user?: Array<string>,
        extra_tag?: Array<number>
    }
}

export interface IWAdminListResult {
    errcode?: number,
    errmsg?: string,
    admin: Array<IWAdminList>
}

export interface IWAdminList {
    userid: string,   //管理员的userid
    auth_type: number, //管理员对应用的权限， 0表示发消息权限，1表示管理权限
}

export interface JsApiTicket {
    errcode: number,
    errmsg: string,
    ticket: string,
    expires_in: number
}

