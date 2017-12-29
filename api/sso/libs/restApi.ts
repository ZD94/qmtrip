import { WStaff, IWStaff } from "api/sso/libs/wechat-staff";
import { IWDepartment } from "api/sso/libs/wechat-department";

var request = require("request-promise");


const enum EIteratorSwitch {
    ACCESS_ITERATABLE = 1,  //表示迭代获取
    ACCESS_NO_ITERATOR = 0  //不使用迭代获取，只获取当前
}
export class RestApi {

    access_token: string;
    constructor(access_token: string){
        this.access_token = access_token;
    }

    /**根据corpid和secret获取该公司的access_token */
    static async getAccessToken(corpid: string, secret: string): Promise<IAccessToken>{
        // let url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret==${secret}`;
        let url = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wwb398745b82d67068&corpsecret=x51OLfe5UWqI5VEW2nXg6tAph5P8kPqmJ_RxtgnbPBE'
        let result: IAccessToken = await reqProxy({
            url,
            method: 'GET'
        });
        if(result && result.errcode == 0) 
            return result;
        return null;
    }

    /**根据该公司的access_token获取某个staff的信息 */
    async getStaff(userid?: string){
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
            enable: result.enable,
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
        async getDepartments(id?: string): Promise<Array<IWDepartment>>{
            let url = `https://qyapi.weixin.qq.com/cgi-bin/department/list`;
            let qs: {access_token: string, id?: string} = {
                access_token: this.access_token
            }
            if(id) qs['id'] = id;
            console.log("=====this department: ", qs, url)
            let result: IDepartmentResult = await reqProxy({
                url,
                method: 'GET',
                qs: qs
            });
            if(!result) return null;
            return result.department;
        }

        /**
         * @method 根据该公司的access_token获取部门成员信息
         * @param.departmentId {string} 部门id
         * @param.fetchChild {number} 0: 关闭递归获取子部门下面的成员 1: 递归获取所有部门成员
         * @return {IMemberListResult}
         */
        async getDetailedStaffsByDepartment(departmentId?: string, fetchChild?: number): Promise<Array<IWStaff>>{
            let url = 'https://qyapi.weixin.qq.com/cgi-bin/user/list';
            let qs: {
                access_token: string,
                department_id: string,
                fetch_child?: number
            } = {
                access_token: this.access_token,
                department_id: departmentId
            }
            if(fetchChild) qs.fetch_child = fetchChild;
            let result: IMemberListResult = await reqProxy({
                url,
                method: 'GET',
                qs
            });
            if(!result || !result.userlist)
                return null;
            return result.userlist;
        }

        /**
         * @method 根据该公司的access_token获取部门成员简单信息
         * @param.departmentId {string} 部门id
         * @param.fetchChild {number} 是否递归获取子部门下面的成员
         * @return {IConciseMemberListResult}
         */
        async getConciseStaffsByDepartment(departmentId?: string, fetchChild?: number): Promise<IConciseMemberListResult>{
            let url = 'https://qyapi.weixin.qq.com/cgi-bin/user/simplelist';
            let qs: {
                access_token: string,
                department_id: string,
                fetch_child?: number
            } = {
                access_token: this.access_token,
                department_id: departmentId,
            }
            if(fetchChild) qs.fetch_child = fetchChild;
            let result: IConciseMemberListResult = await reqProxy({
                url,
                method: 'GET',
                qs
            });
            return result;
        }
}


async function reqProxy(params: {
    url: string,
    method: string,
    body?: any,
    qs?: any
}): Promise<any>{
    let {url, method, body = {}, qs = {}} = params;
    let result;
    let options
    try{
        result = await request({ url, method, body, qs, json: true});
    }catch(err) {
        if(err)
            throw new Error(err);
    }
    if(typeof result == 'string')
        result = JSON.parse(result);
    if(!result) 
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