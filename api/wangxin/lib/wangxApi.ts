/**
 * Created by lei.liu on 2017/11/29
 * 网信接口调用类。
 */
"use strict"

export interface IWangxDepartment {
    id: number;
    name: string;
    pid: number;
    sort: number;
    status: number;
}
export interface IWangxUser {
    email: string;
    id: number;
    name: string;
    phone: string;
    role: number;
    sex: string;
    status: number;
    tel: string;
    usercode: string;
}
export default class WangXinApi {

    private sysCode: string;
    constructor(sysCode: string) {
        this.sysCode = sysCode;
    }

    async getDepartments(pid?: string) :Promise<Array<IWangxDepartment>> {
        let url = `http://netsense.com.cn/rest/open/dept/page`;
        let options: any = {syscode: this.sysCode};
        if(pid) options.pid = pid;
        let result = await pushRequest(url, options);
        if(result["result"] && result["result"]["total"]){
            let totalNum = result["result"]["total"];
            let departments = result["rows"];
            if(totalNum > 10){
                options.pageSize = totalNum;
                let totalResult = await pushRequest(url, options);
                if(totalResult["rows"] && result["rows"]["length"]) {
                    departments = totalResult["rows"];
                }
            }
            let returnDept: IWangxDepartment[] = [];
            departments.map((item) => {
                if(item.status == 0){
                    returnDept.push(item);
                }
            })
            return departments;
        }

        return null;
    }

    async getDeptByUser(userId){
        let url = `http://netsense.com.cn/rest/open/dept/find`;
        let options: any = {syscode: this.sysCode, userId: userId};
        let result = await pushRequest(url, options);
        if(result["result"] && result["result"]["total"]){
            let departments = result["rows"];
            let returnDept: IWangxDepartment[] = [];
            departments.map((item) => {
                if(item.status == 0){
                    returnDept.push(item);
                }
            })
            return departments;
        }

        return null;
    }

    async getDepartmentById(deptId) :Promise<IWangxDepartment> {
        let url = `http://netsense.com.cn/rest/open/dept/page`;
        let option: any = {syscode: this.sysCode, deptId: deptId};
        let result = await pushRequest(url, option);
        if(result["result"] && result["result"]["total"]){
            if(result["rows"][0] && result["rows"][0].status == 0){
                return result["rows"][0];
            }
        }

        return null;
    }

    async getUsers() :Promise<Array<IWangxUser>> {
        let url = `http://netsense.com.cn/rest/open/user/page`;
        let result = await pushRequest(url, {syscode: this.sysCode});
        if(result["result"] && result["result"]["total"]){
            let totalNum = result["result"]["total"];
            let users = result["rows"];
            if(totalNum > 10){
                let totalResult = await pushRequest(url, {syscode: this.sysCode, pageSize: totalNum});
                if(totalResult["rows"] && result["rows"]["length"]){
                    users = totalResult["rows"];
                }
            }
            let returnUsers: IWangxUser[] = [];
            users.map((item) => {
                if(item.status == 0){
                    returnUsers.push(item);
                }
            })
            return returnUsers;
        }

        return null;
    }

    async getUsersBydept(deptId) :Promise<Array<IWangxUser>> {
        let url = `http://netsense.com.cn/rest/open/user/find`;
        let result = await pushRequest(url, {syscode: this.sysCode, deptId: deptId});
        if(result["result"] && result["result"]["total"]){
            let totalNum = result["result"]["total"];
            let users = result["rows"];
            if(totalNum > 10){
                let totalResult = await pushRequest(url, {syscode: this.sysCode, deptId: deptId, pageSize: totalNum});
                if(totalResult["rows"] && result["rows"]["length"]){
                    users = totalResult["rows"];
                }
            }
            let returnUsers: IWangxUser[] = [];
            users.map((item) => {
                if(item.status == 0){
                    returnUsers.push(item);
                }
            })
            return returnUsers;
        }

        return null;
    }

    async getUserById(userId) :Promise<IWangxDepartment> {
        let url = `http://netsense.com.cn/rest/open/user/find`;
        let result = await pushRequest(url, {syscode: this.sysCode, userId: userId});
        if(result["result"] && result["result"]["total"]){
            if(result["rows"][0] && result["rows"][0].status == 0){
                return result["rows"][0];
            }
        }

        return null;
    }

}

async function pushRequest(url, params){
    return new Promise((resolve, reject) => {
        return request({
            uri: url,
            body: params,
            json:true,
            method: "post",
        }, (err, resp, result) => {
            if (err) {
                return reject(err);
            }
            if(typeof(result) == 'string'){
                result = JSON.parse(result);
            }
            return resolve(result);
        })
    })

}