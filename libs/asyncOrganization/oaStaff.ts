/**
 * Created by wangyali on 2017/7/7.
 */
import {OaDepartment} from "./OaDepartment";
import {Models} from "_types/index";
import {Staff} from "_types/staff";
import {Company, CPropertyType} from "_types/company";
import {Department} from "_types/department";
import L from '@jingli/language';

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

    abstract get company();
    abstract set company(val: Company);

    abstract async getDepartments(): Promise<OaDepartment[]>;
    abstract async getSelfById(): Promise<OaStaff>;
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

    async sync(params?:{company: Company}): Promise<Staff>{
        let self = this;
        let company = self.company || params.company;
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

        if(!oaDepartments || oaDepartments.length == 0){
            newDepartments.push(defaultDepartment)
        }else{
            let oaDepartmentIds = await Promise.all(oaDepartments.map(async (item) => {
                let deptPro = await Models.departmentProperty.find({where: {value: item.id}});
                if(!deptPro || deptPro.length == 0){
                    await item.sync();
                }
                return item.id;
            }));
            let departmentProperty = await Models.departmentProperty.find({where: {value: oaDepartmentIds}});
            newDepartments = await Promise.all(departmentProperty.map(async function(item){
                let dept = await Models.department.get(item.departmentId);
                return dept;
            }));
        }

        let alreadyStaff: Staff = await self.getStaff();
        if(!alreadyStaff){

            if(type == CPropertyType.LDAP && companyCreateUser.mobile == self.mobile){

                alreadyStaff = companyCreateUser;
                await self.saveStaffProperty({staffId: alreadyStaff.id});

            }else{

                // 不存在，添加
                let staff = Staff.create({name: self.name, sex: self.sex, mobile: self.mobile, email: self.email, pwd: self.userPassword});
                staff.setTravelPolicy(defaultTravelPolicy);
                staff.company = company;
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
            alreadyStaff.pwd = self.userPassword;
            await alreadyStaff.save();

            // 处理部门
            await alreadyStaff.updateStaffDepartment(newDepartments);
            returnStaff = alreadyStaff;
        }

        return returnStaff;
    }


}