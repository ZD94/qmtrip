/**
 * Created by wangyali on 2017/7/7.
 */
import {OaDepartment} from "./OaDepartment";
import {Models} from "_types/index";
import LdapApi from "../ldapApi";
import LdapDepartment from "../LdapDepartment";
import {Staff, StaffProperty} from "_types/staff";
import {Company, CPropertyType} from "_types/company";
import {Department, DepartmentProperty} from "_types/department";
import LdapStaff from "../ldapStaff";
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

    abstract get dn();
    abstract set dn(val: string);

    abstract async getDepartments(): Promise<OaDepartment[]>;
    abstract async getSelfById(): Promise<OaStaff>;

    static async create(params:{companyId: string, staffId: string}): Promise<OaStaff>{
        let company = await Models.company.get(params.companyId);
        let type = await company.getOaType();
        let staffProperty = await Models.staffProperty.find({where: {type: type, staffId: params.staffId}});
        if(staffProperty && staffProperty.length > 0){
            if(type == CPropertyType.LDAP){
                let ldapProperty = await Models.companyProperty.find({where: {companyId: company.id, type: CPropertyType.LDAP}});
                let ldapInfo = ldapProperty[0].jsonValue;
                if(typeof ldapInfo == "string") ldapInfo = JSON.parse(ldapInfo);

                let ldapApi = new LdapApi(ldapInfo.ldapUrl);
                await ldapApi.bindUser({entryDn: ldapInfo.ldapAdminDn, userPassword: ldapInfo.ldapAdminPassword});
                return new LdapStaff({id: staffProperty[0].value, ldapApi: ldapApi});
            }
        }

        return null;
    }

    async getStaff(): Promise<Staff>{
        let self = this;
        let staff: Staff = null;
        let staffPro = await Models.staffProperty.find({where : {value: self.id}});
        if(staffPro && staffPro.length > 0){
            staff = await Models.staff.get(staffPro[0].staffId);
        }
        return staff;
    }

    async sync(params:{companyId: string, type: string}): Promise<Staff>{
        let self = this;
        let {companyId, type} = params;
        let company: Company;
        if(companyId){
            company = await Models.company.get(companyId);
        }else{
            let staff = await Staff.getCurrent();
            company = staff.company;
        }

        let defaultDepartment = await company.getDefaultDepartment();
        let defaultTravelPolicy = await company.getDefaultTravelPolicy();

        // let staffProperty = await Models.staffProperty.find({where : {type: type, value: self.id}});
        let companyCreateUser = await Models.staff.get(company.createUser);

        let returnStaff: Staff;
        let newDepartments: Department[] = [];

        // 处理部门
        let oaDepartments = await self.getDepartments();

        if(!oaDepartments){
            newDepartments.push(defaultDepartment)
        }else{
            let oaDepartmentIds = oaDepartments.map((item) => {
                return item.id;
            })
            let departmentProperty = await Models.departmentProperty.find({where: {value: oaDepartmentIds, type: type}});
            newDepartments = await Promise.all(departmentProperty.map(async function(item){
                let dept = await Models.department.get(item.departmentId);
                return dept;
            }));
        }

        let alreadyStaff: Staff = await self.getStaff();
        if(!alreadyStaff){

            if(type == CPropertyType.LDAP && companyCreateUser.mobile == self.mobile){

                alreadyStaff = companyCreateUser;
                let staffProperty = StaffProperty.create({staffId: alreadyStaff.id, type: type, value: self.id});
                await staffProperty.save();

            }else{

                // 不存在，添加
                let staff = Staff.create({name: self.name, sex: self.sex, mobile: self.mobile, email: self.email, pwd: self.userPassword});
                staff.setTravelPolicy(defaultTravelPolicy);
                staff.company = company;
                staff = await staff.save();
                let staffProperty = StaffProperty.create({staffId: staff.id, type: type, value: self.id});
                await staffProperty.save();

                // 处理部门
                await staff.addDepartment(newDepartments);
                returnStaff = staff;
            }
        }

        if(alreadyStaff && alreadyStaff.id){
            for(let k in self){
                console.info(k);
                console.info(self[k]);
                console.info("oaStaffKey==================================测试测试测试");
            }
            alreadyStaff.name = self.name;
            // alreadyStaff.sex = self.sex;//类型有问题
            alreadyStaff.mobile = self.mobile;
            alreadyStaff.email = self.email;
            alreadyStaff.pwd = self.userPassword;
            await alreadyStaff.save();

            // 处理部门
            await alreadyStaff.updateStaffDepartment(newDepartments);
            returnStaff = alreadyStaff;
        }

        return returnStaff;
    }


}