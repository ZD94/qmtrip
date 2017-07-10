/**
 * Created by wangyali on 2017/7/7.
 */
import {Models} from "_types/index";
import {Company, CPropertyType} from "_types/company";
import {Staff, StaffProperty} from "_types/staff";
import {Department, DepartmentProperty, StaffDepartment} from "_types/department";
import { OaDepartment } from './oaDepartment';
import { OaStaff } from './OaStaff';

export class SyncData {

    async syncOrganization(company: Company, department: Department): Promise<boolean> {
        return true;

    }

    async syncOrganization3(rootDepartment: OaDepartment, companyId: string, type: string): Promise<boolean> {

        /*let self = this;
        // let rootDepartment = await self.getSyncOaDepartment(rootDepartment);
        //1、同步自身信息
        let department = await rootDepartment.sync({companyId: companyId, type: type});

        //2、同步部门下员工
        let oaStaffs = await rootDepartment.getStaffs();
        let oaStaffsIds = [];
        if (oaStaffs && oaStaffs.length > 0) {
            oaStaffsIds = await Promise.all(oaStaffs.map(async (item) => {
                let ret = await item.sync({companyId: companyId, type: type});
                return ret.id;
            }))
        }

        //3、删除被删除的员工
        let options: {where: any} = {where: {departmentId: department.id}};
        if(oaStaffsIds && oaStaffsIds.length > 0){
            options.where.value = {$notIn: oaStaffsIds};
        }
        let staffDepartments = await Models.staffDepartment.all(options);
        if(staffDepartments && staffDepartments.length > 0){
            await Promise.all(staffDepartments.map(async (item) => {
                let deletedStaff = await Models.staff.get(item.staffId);
                let staffProperty = await Models.staffProperty.find({where: {staffId: deletedStaff.id}});
                if(staffProperty && staffProperty.length > 0){
                    await Promise.all(staffProperty.map(async (item) => {
                        await item.destroy();
                    }))
                }
                await deletedStaff.destroy();
            }))
        }

        let childrenDepartments = await rootDepartment.getChildrenDepartments();
        //4、删除被删除的子部门
        let oaDepartmentIds = [];
        if(childrenDepartments && childrenDepartments.length > 0){
            oaDepartmentIds = childrenDepartments.map((item => {
                return item.id;
            }))
        }
        let childrenDepts = await Models.department.all({where: {parentId: department.id}});
        let departmentIds = childrenDepts.map((item) => {
            return item.id
        })
        let deptOptions: {where: any} = {where: {departmentId: departmentIds}};
        if(childrenDepartments && childrenDepartments.length > 0){
            options.where.value = {$notIn: oaDepartmentIds};
        }

        let deleteDept = await Models.departmentProperty.find(options);
        await Promise.all(deleteDept.map(async(item) => {
            await item.destroy();
        }))

        //5、递归同步子部门信息
        if(childrenDepartments && childrenDepartments.length > 0){
            await Promise.all(childrenDepartments.map(async (item) => {
                let result = await self.syncOrganization3(item, companyId, type);
            }))
        }*/

        return true;

    }

    /*async getSyncOaDepartment(oaDepartment: OaDepartment): Promise<OaDepartment>{
        let self = this;
        let result: OaDepartment;
        let department = await oaDepartment.getDepartment();
        if(!department){
            let oaParent = await oaDepartment.getParent();
            if(oaParent){
                result = await self.getSyncOaDepartment(oaParent);
            }else{
                result = oaDepartment;
            }
        }else{
            result = oaDepartment;
        }
        return result;
    }

    async syncOrganization2(rootDepartment: OaDepartment, companyId: string, type: string): Promise<boolean> {

        let self = this;
        // let rootDepartment = await self.getSyncOaDepartment(rootDepartment);
        let department = await rootDepartment.sync({companyId: companyId, type: type});

        let oaStaffs = await rootDepartment.getStaffs();
        if (oaStaffs && oaStaffs.length > 0) {
            await Promise.all(oaStaffs.map(async (item) => {
                await item.sync({companyId: companyId, type: type});
            }))
        }

        let staffs = await department.getStaffs();
        if(staffs && staffs.length > 0){
            staffs.map(async (item) => {
                let oaStaff = await OaStaff.create({companyId: companyId, staffId: item.id});
                if(oaStaff){
                    let oaStaffObject = oaStaff.getSelfById();
                    if(!oaStaffObject){
                        await item.destroy();
                    }
                }else{
                    await item.destroy();
                }
            })
        }

        let childrenDepts = await Models.department.all({parentId: department.id, companyId: companyId});
        if(childrenDepts && childrenDepts.length > 0){
            childrenDepts.map(async (item) => {
                let oaDepartment = await OaDepartment.create({companyId: companyId, departmentId: item.id});
                if(oaDepartment){
                    //如果某部门只是被移动到了其他部门下 并没有被删除 该逻辑有问题 员工也是
                    let oaDepartmentObject = oaDepartment.getSelfById();
                    if(!oaDepartmentObject){
                        await item.destroy();
                    }
                }else{
                    await item.destroy();
                }
            })
        }

        //递归同步子部门信息
        let childrenDepartments = await rootDepartment.getChildrenDepartments();
        if(childrenDepartments && childrenDepartments.length > 0){
            await Promise.all(childrenDepartments.map(async (item) => {
                let result = await self.syncOrganization1(item, companyId, type);
            }))
        }

        return true;

    }

    async syncOrganization1(rootDepartment: OaDepartment, companyId: string, type: string): Promise<Department[]>{

        let self = this;

        let company: Company;
        if(companyId){
            company = await Models.company.get(companyId);
        }else{
            let staff = await Staff.getCurrent();
            company = staff.company;
        }

        let defaultDepartment = await company.getDefaultDepartment();
        let deptPro = await Models.departmentProperty.find({where : {type: type, value: rootDepartment.id}});

        let department: Department;
        let parentDepartment: Department;
        let departments: Department[] = [];

        if(!rootDepartment.parentId){
            parentDepartment = defaultDepartment;
        }else{
            let deptProperty = await Models.departmentProperty.find({where : {type: type, value: rootDepartment.parentId}});
            if(deptProperty && deptProperty.length > 0){
                let parentDept = await Models.department.get(deptProperty[0].departmentId);
                parentDepartment = parentDept;
            }else{
                parentDepartment = defaultDepartment;
            }
        }
        if(deptPro && deptPro.length > 0){
            // 已存在，修改
            let alreadyDepartment = await Models.department.get(deptPro[0].departmentId);
            alreadyDepartment.name = rootDepartment.name;//同步已有部门信息
            if(!alreadyDepartment.parent || parentDepartment.id != alreadyDepartment.parent.id){
                alreadyDepartment.parent = parentDepartment;
            }
            department = await alreadyDepartment.save();
        }else{
            // 不存在，添加
            let dept =  Department.create({name: rootDepartment.name});
            dept.company = company;
            dept.parent = parentDepartment;
            department = await dept.save();
            let departmentProperty = DepartmentProperty.create({departmentId: dept.id, type: type, value: rootDepartment.id});
            await departmentProperty.save();
        }
        departments.push(department);

        //同步部门下员工
        let oaStaffs = await rootDepartment.getStaffs();
        let oaStaffsIds = [];
        if(oaStaffs && oaStaffs.length > 0){
            oaStaffsIds = await Promise.all(oaStaffs.map(async (item) => {
                await self.syncStaffItem(item, companyId, type);
                return item.id;
            }))
        }

        //判断被删除的员工（问题：此时如果是在我们系统里单独加入的员工怎么处理）
        let options: {where: any} = {where: {departmentId: department.id}};
        if(oaStaffsIds && oaStaffsIds.length > 0){
            options.where.value = {$notIn: oaStaffsIds};
        }
        let staffDepartments = await Models.staffDepartment.all(options);
        if(staffDepartments && staffDepartments.length > 0){
            await Promise.all(staffDepartments.map(async (item) => {
                let deletedStaff = await Models.staff.get(item.staffId);
                let staffProperty = await Models.staffProperty.find({where: {staffId: deletedStaff.id}});
                if(staffProperty && staffProperty.length > 0){
                    await Promise.all(staffProperty.map(async (item) => {
                        await item.destroy();
                    }))
                }
                await deletedStaff.destroy();
            }))
        }

        let childrenDepartments = await rootDepartment.getChildrenDepartments();
        //判断被删除的子部门的信息
        let oaDepartmentIds = [];
        if(childrenDepartments && childrenDepartments.length > 0){
            oaDepartmentIds = childrenDepartments.map((item => {
                return item.id;
            }))
        }
        let childrenDepts = await Models.department.all({where: {parentId: department.id}});
        let departmentIds = childrenDepts.map((item) => {
            return item.id
        })
        let deptOptions: {where: any} = {where: {departmentId: departmentIds}};
        if(childrenDepartments && childrenDepartments.length > 0){
            options.where.value = {$notIn: oaDepartmentIds};
        }

        let deleteDept = await Models.departmentProperty.find(options);
        await Promise.all(deleteDept.map(async(item) => {
            await item.destroy();
        }))
        //递归同步子部门信息
        if(childrenDepartments && childrenDepartments.length > 0){
            await Promise.all(childrenDepartments.map(async (item) => {
                let result = await self.syncOrganization1(item, companyId, type);
                departments.push.apply(result);
            }))
        }


        console.info(departments);
        console.info("departments==============================");
        return departments;
    }

    async syncStaffItem(oaStaff: OaStaff, companyId: string, type: string): Promise<Staff>{
        let self = this;
        let company: Company;
        if(companyId){
            company = await Models.company.get(companyId);
        }else{
            let staff = await Staff.getCurrent();
            company = staff.company;
        }

        let defaultDepartment = await company.getDefaultDepartment();
        let defaultTravelPolicy = await company.getDefaultTravelPolicy();

        let staffProperty = await Models.staffProperty.find({where : {type: type, value: oaStaff.id}});
        let companyCreateUser = await Models.staff.get(company.createUser);
        let alreadyStaff: Staff;
        let returnStaff: Staff;
        let newDepartments: Department[] = [];

        // 处理部门
        let oaDepartments = await oaStaff.getDepartments();

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


        if(staffProperty && staffProperty.length > 0){
            // 已存在，修改
            alreadyStaff = await Models.staff.get(staffProperty[0].staffId);

        }else{

            if(type == CPropertyType.LDAP && companyCreateUser.mobile == oaStaff.mobile){

                alreadyStaff = companyCreateUser;
                let staffProperty = StaffProperty.create({staffId: alreadyStaff.id, type: type, value: oaStaff.id});
                await staffProperty.save();

            }else{

                // 不存在，添加
                let staff = Staff.create({name: oaStaff.name, sex: oaStaff.sex, mobile: oaStaff.mobile, email: oaStaff.email, pwd: oaStaff.userPassword});
                staff.setTravelPolicy(defaultTravelPolicy);
                staff.company = company;
                staff = await staff.save();
                let staffProperty = StaffProperty.create({staffId: staff.id, type: type, value: oaStaff.id});
                await staffProperty.save();

                // 处理部门
                await staff.addDepartment(newDepartments);
                returnStaff = staff;
            }
        }

        if(alreadyStaff && alreadyStaff.id){
            for(let k in oaStaff){
                console.info(k);
                console.info(oaStaff[k]);
                console.info("oaStaffKey==================================测试测试测试");
            }
            alreadyStaff.name = oaStaff.name;
            // alreadyStaff.sex = oaStaff.sex;//类型有问题
            alreadyStaff.mobile = oaStaff.mobile;
            alreadyStaff.email = oaStaff.email;
            alreadyStaff.pwd = oaStaff.userPassword;
            await alreadyStaff.save();

            // 处理部门
            await alreadyStaff.updateStaffDepartment(newDepartments);
            returnStaff = alreadyStaff;
        }

        return returnStaff;
    }

    async syncOneStaff(oaStaff: OaStaff, companyId: string, type: string): Promise<boolean>{
        let self = this;
        let oaDepartments = await oaStaff.getDepartments();

        if(!oaDepartments){
            await self.syncStaffItem(oaStaff, companyId, type);
        }else{
            await Promise.all(oaDepartments.map(async (item) => {
                await self.syncOrganization1(item, companyId, type);
            }))
        }
        return true;
    }*/

}

let syncData = new SyncData();
export default syncData;