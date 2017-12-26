import { WStaff, IWStaff } from "api/sso/libs/wechat-staff";
import { IWDepartment } from "api/sso/libs/wechat-department";

var request = require("request-promise");

export class RestApi {

    access_token: string;
    constructor(access_token: string){

    }

    /**根据corpid和secret获取该公司的access_token */
    static async getAccessToken(corpid: string, secret: string): Promise<IAccessToken>{
        let url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret==${secret}`;
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
        let result = await reqProxy({
            url,
            method: 'GET'
        });
        return result;
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
        async getDepartments(id?: string): Promise<IDepartmentResult>{
            let url = `https://qyapi.weixin.qq.com/cgi-bin/department/list`;
            let qs: {access_token: string, id?: string} = {
                access_token: this.access_token
            }
            if(id) qs['id'] = id;
            let result: IDepartmentResult = await reqProxy({
                url,
                method: 'GET',
                qs: qs
            });
            return result;
        }

        /**
         * @method 根据该公司的access_token获取部门成员信息
         * @param.departmentId {string} 部门id
         * @param.fetchChild {number} 是否递归获取子部门下面的成员
         * @return {IMemberListResult}
         */
        async getMembersOfDepartment(departmentId?: string, fetchChild?: number): Promise<IMemberListResult>{
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
            return result;
        }

        /**
         * @method 根据该公司的access_token获取部门成员简单信息
         * @param.departmentId {string} 部门id
         * @param.fetchChild {number} 是否递归获取子部门下面的成员
         * @return {IConciseMemberListResult}
         */
        async getConciseStaffList(departmentId?: string, fetchChild?: number): Promise<IConciseMemberListResult>{
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
    try{
        result = await request({ url, method, body, qs, json: true});
    }catch(err) {
        if(err)
            return null;
    }
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