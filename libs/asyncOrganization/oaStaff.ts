/**
 * Created by wangyali on 2017/7/7.
 */
import {OaDepartment} from "./OaDepartment";
import {Models} from "_types/index";
import {Staff, EStaffRole, EStaffStatus, EAddWay} from "_types/staff";
import {Company, CPropertyType} from "_types/company";
import {ACCOUNT_STATUS} from "_types/auth";
import {Department} from "_types/department";
import L from '@jingli/language';
import utils = require("common/utils");
// import {Account} from "_types/auth";
const DEFAULT_PWD = '000000';
export  abstract class OaStaff{
    constructor(public target: any){
    }
    abstract get id();
    abstract set id(val: string);

    abstract get name();
    abstract set name(val: string);

    abstract get mobile();
    abstract set mobile(val: string);

    abstract get email();
    abstract set email(val: string);

    abstract get userPassword();
    abstract set userPassword(val: string);

    abstract get sex();
    abstract set sex(val: string);

    abstract get avatar();
    abstract set avatar(val: string);

    abstract get isAdmin();
    abstract set isAdmin(val: boolean);

    abstract get company();
    abstract set company(val: Company);

    abstract async getDepartments(): Promise<OaDepartment[]>;
    abstract async getSelfById(): Promise<OaStaff|null>;
    abstract async getCompany(): Promise<Company|null>;
    abstract async saveStaffProperty(params: {staffId: string}): Promise<boolean>;

    async getStaff(): Promise<Staff|null>{
        let self = this;
        let staff: Staff|null = null
        let staffPro = await Models.staffProperty.find({where : {value: self.id}});
        if(staffPro && staffPro.length > 0){
            staff = await Models.staff.get(staffPro[0].staffId);
        }
        return staff;
    }

    async leaveOrg(): Promise<boolean>{
        let self = this;
        let staff = await self.getStaff();
        if(staff){
            await staff.deleteStaffProperty();

            staff.staffStatus = EStaffStatus.QUIT_JOB;
            await staff.save();

            let deleteAccount = await Models.account.get(staff.accountId);
            deleteAccount && await deleteAccount.destroy();

            await staff.deleteStaffDepartments();
        }

        return true;
    }

    async sync(params?:{company?: Company, from?: string}): Promise<Staff|null>{
        console.info(this.name, "staff sync begin==================================");
        if(!params) params = {};
        let self = this;
        let from  = params.from;
        let company: Company | null = self.company;
        if(params.company){
            company = params.company;
        }
        let execute = true;
        let returnStaff: Staff | null = null;

        // let staffKey = "tmp_staff_code:" + self.id + "_" + company.id;
        // let isExist = await cache.read(staffKey);
        // if (isExist) {
        //     console.log("on sync ing==========?");
        //     execute = false;
        // }
        // //暂时缓存，防止重复触发
        // await cache.write(staffKey, true, 10 * 1);

        if(execute || (from && from == "createUser")){
            if(params){
                company = params.company || null;
            }
            if(!company){
                company = await self.getCompany();
            }
            let type = company && await company.getOaType() || undefined;
            if(!company){
                throw L.ERR.INVALID_ACCESS_ERR();
            }

            let defaultDepartment = await company.getDefaultDepartment();
            /*let defaultTravelPolicy = await company.getDefaultTravelPolicy();

            if (!defaultTravelPolicy) {
                throw L.ERR.ERROR_CODE_C(500, `企业默认差旅标准还未设置`);
            }*/
            let companyCreateUser = await Models.staff.get(company.createUser);

            let newDepartments: Department[] = [];

            // 处理部门
            let oaDepartments = await self.getDepartments();

            if(!oaDepartments || !oaDepartments.length){
                newDepartments.push(defaultDepartment)
            }else{
                await Promise.all(oaDepartments.map(async (item) => {
                    let department = await item.getDepartment();
                    if(!department){
                        let dept = await item.sync({company: company || undefined, from: "addStaff"});//此处需要验证
                        dept && newDepartments.push(dept);
                    }else{
                        newDepartments.push(department);
                    }
                }));
            }

            if(!(newDepartments && newDepartments.length)){
                console.log("没有部门放在跟部门下");
                newDepartments.push(defaultDepartment);
            }
            let alreadyStaff: Staff | null = await self.getStaff();
            let pwd = self.userPassword || DEFAULT_PWD;
            let roleId = EStaffRole.COMMON;
            if(self.isAdmin) roleId = EStaffRole.ADMIN;
            if(!alreadyStaff){

                if(companyCreateUser && ((self.mobile && type == CPropertyType.LDAP && companyCreateUser.mobile == self.mobile) ||
                    (type == CPropertyType.WANGXIN_ID && companyCreateUser.mobile == self.mobile))){

                    alreadyStaff = companyCreateUser;
                    await self.saveStaffProperty({staffId: alreadyStaff ? alreadyStaff.id : ""});
                } else{
                    // 不存在，添加
                    let staff = Staff.create({name: self.name, sex: self.sex, mobile: self.mobile, email: self.email, roleId: roleId, pwd: utils.md5(pwd), avatar: self.avatar});
                    // staff.travelPolicyId = defaultTravelPolicy.id;
                    //补充逻辑: 当account信息已存在，无须再次创建
                    // if((self.mobile && self.mobile != '') || (self.email && self.email != '')) {
                    //     let accounts = await Models.account.find({
                    //         where: {
                    //             $or: {
                    //                 email: self.email,
                    //                 mobile: self.mobile
                    //             }
                    //         }
                    //     })
                    //     if(accounts && accounts.length) {
                    //         staff.accountId = accounts[0].id;
                    //     } else {
                    //         let account = Account.create({
                    //             mobile: self.mobile, 
                    //             email: self.email
                    //         });
                    //         account = await account.save();
                    //         if(account) staff.accountId = account.id;
                    //     }
                    // }
                    staff.company = company;
                    staff.staffStatus = EStaffStatus.ON_JOB;
                    staff.addWay = EAddWay.OA_SYNC;
                    staff.status = ACCOUNT_STATUS.ACTIVE;
                    staff = await staff.save();
                    await self.saveStaffProperty({staffId: staff.id});

                    // 处理部门
                    await staff.addDepartment(newDepartments);
                    returnStaff = staff;
                }
            }

            if(alreadyStaff && alreadyStaff.id){
                if(type == CPropertyType.WECHAT_CORPID && companyCreateUser && alreadyStaff.id == companyCreateUser.id) {
                    await self.saveStaffProperty({staffId: alreadyStaff.id});
                }
                alreadyStaff.name = self.name;
                // alreadyStaff.sex = self.sex;//类型有问题
                alreadyStaff.mobile = self.mobile;
                alreadyStaff.email = self.email;
                alreadyStaff.pwd = utils.md5(pwd);
                if(self.avatar) alreadyStaff.avatar = self.avatar;
                // alreadyStaff.roleId = roleId;//ldap此处更新权限有问题 创建者被更新为了普通员工
                alreadyStaff.staffStatus = EStaffStatus.ON_JOB;
                alreadyStaff.addWay = EAddWay.OA_SYNC;
                alreadyStaff.status = ACCOUNT_STATUS.ACTIVE;
                await alreadyStaff.save();

                // 处理部门
                await alreadyStaff.updateStaffDepartment(newDepartments);
                returnStaff = alreadyStaff;
            }
        }
        console.info(this.name, "staff sync end==================================");

        return returnStaff;
    }


}