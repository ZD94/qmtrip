/**
 * Created by wangyali on 2017/7/7.
 */
import {OaDepartment} from "./OaDepartment";
import {Models} from "_types/index";
import {Staff, EStaffRole, EStaffStatus, EAddWay} from "_types/staff";
import {Company, CPropertyType} from "_types/company";
import {Department} from "_types/department";
import L from '@jingli/language';
import utils = require("common/utils");

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

    abstract get isAdmin();
    abstract set isAdmin(val: boolean);

    abstract get company();
    abstract set company(val: Company);

    abstract async getDepartments(): Promise<OaDepartment[]>;
    abstract async getSelfById(): Promise<OaStaff>;
    abstract async getCompany(): Promise<Company>;
    abstract async saveStaffProperty(params: {staffId: string}): Promise<boolean>;

    async getStaff(): Promise<Staff>{
        let self = this;
        let staff: Staff = null;
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

            await staff.deleteStaffDepartments();
        }

        return true;
    }

    async sync(params?:{company: Company}): Promise<Staff>{
        let self = this;
        let company = self.company;
        if(params){
            company = params.company;
        }
        if(!company){
            company = await self.getCompany();
        }
        let type = await company.getOaType();
        /*if(!company){
            let staff = await Staff.getCurrent();
            company = staff.company;
        }*/
        if(!company){
            throw L.ERR.INVALID_ACCESS_ERR();
        }

        let defaultDepartment = await company.getDefaultDepartment();
        let defaultTravelPolicy = await company.getDefaultTravelPolicy();

        let companyCreateUser = await Models.staff.get(company.createUser);

        let returnStaff: Staff;
        let newDepartments: Department[] = [];

        // 处理部门
        let oaDepartments = await self.getDepartments();

        if(!oaDepartments || !oaDepartments.length){
            newDepartments.push(defaultDepartment)
        }else{
            let oaDepartmentIds = await Promise.all(oaDepartments.map(async (item) => {
                let department = await item.getDepartment();
                if(!department){
                    // let dept = await item.sync({company: company});//此处需要验证
                    // newDepartments.push(dept);
                }else{
                    newDepartments.push(department);
                }
            }));
        }

        let alreadyStaff: Staff = await self.getStaff();
        let pwd = self.userPassword || DEFAULT_PWD;
        let roleId = EStaffRole.COMMON;
        if(self.isAdmin) roleId = EStaffRole.ADMIN;
        if(!alreadyStaff){

            if(type == CPropertyType.LDAP && companyCreateUser.mobile == self.mobile){

                alreadyStaff = companyCreateUser;
                await self.saveStaffProperty({staffId: alreadyStaff.id});

            }else{
                // 不存在，添加
                let staff = Staff.create({name: self.name, sex: self.sex, mobile: self.mobile, email: self.email, roleId: roleId, pwd: utils.md5(pwd)});
                staff.setTravelPolicy(defaultTravelPolicy);
                staff.company = company;
                staff.staffStatus = EStaffStatus.ON_JOB;
                staff.addWay = EAddWay.OA_SYNC;
                staff = await staff.save();
                await self.saveStaffProperty({staffId: staff.id});

                // 处理部门
                await staff.addDepartment(newDepartments);
                returnStaff = staff;
            }
        }

        if(alreadyStaff && alreadyStaff.id){
            alreadyStaff.name = self.name;
            // alreadyStaff.sex = self.sex;//类型有问题
            alreadyStaff.mobile = self.mobile;
            alreadyStaff.email = self.email;
            alreadyStaff.pwd = utils.md5(pwd);
            // alreadyStaff.roleId = roleId;//ldap此处更新权限有问题 创建者被更新为了普通员工
            alreadyStaff.staffStatus = EStaffStatus.ON_JOB;
            alreadyStaff.addWay = EAddWay.OA_SYNC;
            await alreadyStaff.save();

            // 处理部门
            await alreadyStaff.updateStaffDepartment(newDepartments);
            returnStaff = alreadyStaff;
        }

        return returnStaff;
    }


}