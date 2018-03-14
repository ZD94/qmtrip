/**
 * Created by lei.liu on 2017/11/29
 * 网信接口调用类。
 */
"use strict"
var request = require("request");

export interface IWangxDepartment {
    id: string;
    name: string;
    pid: string;
    sort: number;
    status: number;
}
export interface IWangxUser {
    email: string;
    id: string;
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
        let url = `http://netsense.com.cn:9003/rest/open/dept/page`;
        let options: any = {syscode: this.sysCode};
        if(pid) options.pid = pid;
        let result = await pushRequest(url, options);
        if(result && result["status"] == 0){
            result = result["result"];
            if(result && result["total"]){
                let totalNum = result["total"];
                let departments: IWangxDepartment[] = result["rows"];
                if(totalNum > 10){
                    options.pageSize = totalNum;
                    let totalResult = await pushRequest(url, options);
                    if(totalResult["result"]["rows"] && totalResult["result"]["rows"]["length"]) {
                        departments = totalResult["result"]["rows"];
                    }
                }
                let returnDept: IWangxDepartment[] = [];
                departments.map((item) => {
                    if(item.status == 0 && item.name != "我的设备"){
                        returnDept.push(item);
                    }
                })
                return returnDept;
            }
        }

        return [];
    }

    async getDeptByUser(userId: string){
        let url = `http://netsense.com.cn:9003/rest/open/dept/find`;
        let options: any = {syscode: this.sysCode, userId: userId};
        let result = await pushRequest(url, options);
        if(result && result["status"] == 0){
            let departments: IWangxDepartment[] = result["result"];
            let returnDept: IWangxDepartment[] = [];
            departments.map((item) => {
                if(item.status == 0){
                    returnDept.push(item);
                }
            })
            return returnDept;
        }

        return null;
    }

    async getDepartmentById(deptId: string) :Promise<IWangxDepartment | null> {
        let url = `http://netsense.com.cn:9003/rest/open/dept/page`;
        let option: any = {syscode: this.sysCode, deptId: deptId};
        let result = await pushRequest(url, option);
        if(result && result["status"] == 0) {
            result = result["result"];
            if(result["rows"] && result["rows"][0] && result["rows"][0].status == 0){
                return result["rows"][0];
            }
        }

        return null;
    }

    async getUsers() :Promise<Array<IWangxUser>> {
        let url = `http://netsense.com.cn:9003/rest/open/user/page`;
        let result = await pushRequest(url, {syscode: this.sysCode});
        if(result && result["status"] == 0){
            result = result["result"];
            if(result && result["total"]){
                let totalNum = result["total"];
                let users: IWangxUser[] = result["rows"];
                if(totalNum > 10){
                    let totalResult = await pushRequest(url, {syscode: this.sysCode, pageSize: totalNum});
                    if(totalResult["result"]["rows"] && totalResult["result"]["rows"]["length"]){
                        users = totalResult["result"]["rows"];
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
        }


        return [];
    }

    async getUsersBydept(deptId: string) :Promise<Array<IWangxUser>> {
        let url = `http://netsense.com.cn:9003/rest/open/user/find`;
        let result = await pushRequest(url, {syscode: this.sysCode, deptId: deptId});
        if(result && result["status"] == 0){
            let users: IWangxUser[] = result["result"];
            let returnUsers: IWangxUser[] = [];
            users.map((item) => {
                if(item.status == 0){
                    returnUsers.push(item);
                }
            })
            return returnUsers;
        }

        return [];
    }

    async getUserById(userId: string) :Promise<IWangxUser | null> {
        let url = `http://netsense.com.cn:9003/rest/open/user/page`;
        let result = await pushRequest(url, {syscode: this.sysCode, userId: userId});
        if(result && result["status"] == 0){
            result = result["result"];
            if(result["rows"] && result["rows"][0] && result["rows"][0].status == 0){
                return result["rows"][0];
            }
        }

        return null;
    }

}

async function pushRequest(url: string, params: object){
    return new Promise((resolve, reject) => {
        return request({
            uri: url,
            body: params,
            json:true,
            method: "post",
        }, (err: Error, resp: any, result: object) => {
            console.log(url, '==>', JSON.stringify(result))
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