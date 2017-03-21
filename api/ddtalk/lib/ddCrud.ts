/*
*   钉钉部分部门，员工 增删改查
*   time @ 2017.3.17
*
*/

import {Models} from "api/_types/index";
import {md5} from "../../../common/utils";
import {Staff} from "../../_types/staff/staff";
import {DDTalkUser} from "../../_types/ddtalk";

let Logger = require('common/logger');
var logger = new Logger('main');
const DEFAULT_PWD = '000000';


export class ddCrud {
    private company: any;
    private travelPolicy : any;

    constructor( public corpId : string ) {
    }

    private async getCompany() {
        let self = this;
        if (self.company){
            return self.company;
        }

        let ddtalkCorp = await Models.ddtalkCorp.find({
            where : { corpId : self.corpId }
        });
        if(ddtalkCorp && ddtalkCorp[0]){
            console.log(22222 , ddtalkCorp[0]["companyId"]);
            let company = await Models.company.get(ddtalkCorp[0]["companyId"]);
            if(company){
                return self.company = company;
            }else{
                throw new Error("没有找到这个企业");
            }
        }else{
            throw new Error("dd关系中没有找到这个企业");
        }
    }


    private async getTravelPolicy(){
        if(this.travelPolicy){
            return this.travelPolicy;
        }
        let company = await this.getCompany();
        return this.travelPolicy = await company.getDefaultTravelPolicy();
    }

    //update staff or create staff.
    async createStaff(ddUserInfo) : Promise<Staff>{
        let travelPolicy = await this.getTravelPolicy();
        let company      = await this.getCompany();

        let ddtalkUser = await Models.ddtalkUser.find({
            where : { ddUserId : ddUserInfo.userid , corpId : this.corpId }
        });
        if(ddtalkUser && ddtalkUser.length){
            //更新员工基本信息
            let staff = await Models.staff.get(ddtalkUser[0].id);
            staff.name = ddUserInfo.name;
            staff.company = company;
            staff.email = ddUserInfo.email;
            staff.mobile = ddUserInfo.mobile;
            staff.avatar = ddUserInfo.avatar;

            console.log("staff 中更新员工" , staff.id);
            return await staff.save();
        }else{
            //创建这个员工
            let _staff = Models.staff.create({name: ddUserInfo.name, travelPolicyId: travelPolicy.id});
            _staff.company = company;
            _staff.pwd = md5(DEFAULT_PWD);
            _staff.status = 1;
            _staff.email = ddUserInfo.email;
            _staff.mobile = ddUserInfo.mobile;
            _staff.avatar = ddUserInfo.avatar;
            _staff = await _staff.save();

            console.log("staff 中新加入员工" , _staff.id);
            return _staff;
        }
    }

    //ddtalkUser 中新加入员工 或者是更新
    async createDDuser( staff , ddUserInfo ) : Promise<DDTalkUser>{
        let ddtalkUsers = await Models.ddtalkUser.find({
            where : { ddUserId : ddUserInfo.userid }
        });
        let dd_info = JSON.stringify( ddUserInfo );
        let ddtalkUser;


        if(ddtalkUsers && ddtalkUsers.length){
            //更新
            ddtalkUser = ddtalkUsers[0];
            ddtalkUser.ddInfo = dd_info;
            ddtalkUser = await ddtalkUser.save();
        }else{
            //添加
            ddtalkUser = Models.ddtalkUser.create({
                id: staff.id,
                avatar: ddUserInfo.avatar,
                dingId: ddUserInfo.dingId,
                isAdmin: ddUserInfo.isAdmin,
                name: ddUserInfo.name,
                ddUserId: ddUserInfo.userid,
                corpId: this.corpId,
                ddInfo: dd_info
            });
            ddtalkUser = await ddtalkUser.save();
            console.log("ddtalkUser 中新加入员工" , ddtalkUser.id);
        }

        return ddtalkUser;
    }

    //ddtalkUser delete
    async deleteDDuser( dd_user_id ){
        let ddtalkUser = await Models.ddtalkUser.find({
            where : { ddUserId:dd_user_id , corpId : this.corpId }
        });

        let staff_id;
        if(ddtalkUser && ddtalkUser.length){
            staff_id = ddtalkUser[0].id;
            await ddtalkUser[0].destroy();
        }

        return staff_id;
    }

    //新增员工添加部门关系
    async addStaffDeparts( staff : Staff , dd_departs : any[] ){
        let self = this;
        let localDepart_ids = [];

        for(let item of dd_departs){
            let ddDeparts = await Models.ddtalkDepartment.find({
                where : { corpId : self.corpId , DdDepartmentId : item.toString() }
            });

            if(ddDeparts && ddDeparts.length){
                let localDepartId = ddDeparts[0].localDepartmentId;
                localDepart_ids.push(localDepartId);

                let staffDeparts = await Models.staffDepartment.find({
                    where : {
                        staffId : staff.id,
                        departmentId : localDepartId
                    }
                });

                if(staffDeparts && staffDeparts[0]){
                    //already have.
                    console.log("部门关系 already have");
                }else{
                    let staffDepart = Models.staffDepartment.create({
                        staffId : staff.id,
                        departmentId : localDepartId
                    });

                    staffDepart = await staffDepart.save();
                }
            }else{
                logger.warn(`员工添加: 部门缺失: , corpId: ${this.corpId} , dd_departId : ${item}`);
            }
        }

        return localDepart_ids;
    }

    /*
     *  清除  部门员工关系 staff_department
     *  type : staff , department
     *  key  : staff or department id.
     *  arr  : 依据staff唯一,传入department数组；依据department唯一，传入staff数组
     */

    async deleteStaffDepartment ( type : string , key , arr ? : string[] ){
        let whereObj = {};
        if(type == "staff"){
            //依据staff 找部门
            if(arr && arr.length){
                whereObj["departmentId"] = { $notIn : arr };
            }
            whereObj["staffId"]          = key;
        }else if(type == "department"){
            //依据department 找员工
            if(arr && arr.length){
                whereObj["staffId"] = { $notIn : arr };
            }
            whereObj["departmentId"] = key;
        }else{
            logger.warn("清除部门关系，参数传入不正确");
            return;
        }

        let results = await Models.staffDepartment.find({
            where : whereObj
        });

        await Promise.all(results.map((item)=>item.destroy()));
    }


    /*
    *   钉钉添加一个部门
    *   添加、更新
    */
    async createDepartment ( ddDepartInfo ){
        let ddDeparts = await Models.ddtalkDepartment.find({
            where : { corpId : this.corpId , DdDepartmentId : ddDepartInfo.id }
        });
        let company = await this.getCompany();
        let parentid;
        if(ddDepartInfo.parentId){
            if(ddDepartInfo.parentId == 1){
                //from root department
                parentid = await company.getRootDepartment();
                parentid = parentid.id;
            }else{

            }
        }else{
            parentid = null;
        }


        if(ddDeparts && ddDeparts.length){
            //update

        }else{
            //add
            if(ddDepartInfo.parentId){

            }else{
                //根部门
                parentid = null;
            }
            let localNewDepartment = {"name": ddDepartInfo.name, "companyId": company.id, "parentId": null};
        }
    }


    /*
    *   获取一个钉钉部门 的 parentId 的本地部门id
    */
    async getParentId( dd_parentId ){
        if(!dd_parentId){
            return null;
        }

        let company = await this.getCompany();
        if(dd_parentId == 1){
            let depart = await company.getRootDepartment();
            return depart;
        }

        let localDeparts = await Models.ddtalkDepartment.find({
            where : { corpId : this.corpId , localDepartmentId : dd_parentId }
        });
        if(localDeparts && localDeparts.length){
            return localDeparts[0];
        }else{
            return undefined;
        }
    }
}
