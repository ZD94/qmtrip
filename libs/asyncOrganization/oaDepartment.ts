/**
 * Created by wangyali on 2017/7/6.
 */
import {Department} from "_types/department";
import {EStaffStatus} from "_types/staff";
import {Company} from "_types/company";
import {Models} from "_types/index";
import L from '@jingli/language';
import {OaStaff} from './oaStaff';

//create（工厂方法）拆除去，删除部门员工修改， 循环引用尽量避免， ldap链接池 connection pool(链接有无状态， 数据库链接有状态，redis链接无状态)
//oaDepartment, oaStaff添加company getParent做限制
export abstract class OaDepartment{
    constructor(public target: any){
    }
    abstract get id();
    abstract set id(val: string);

    abstract get name();
    abstract set name(val: string);

    abstract get manager();
    abstract set manager(val: string);

    abstract get parentId();
    abstract set parentId(val: string);

    abstract get company();
    abstract set company(val: Company);

    abstract async getChildrenDepartments(): Promise<OaDepartment[]>;
    abstract async getParent(): Promise<OaDepartment>;
    abstract async getStaffs(): Promise<OaStaff[]>;
    abstract async getSelfById(): Promise<OaDepartment>;
    abstract async saveDepartmentProperty(params: {departmentId: string}): Promise<boolean>;

    async getDepartment(): Promise<Department>{
        let self = this;
        let department: Department = null;
        if(typeof self.id != 'string')
            self.id = self.id + '';
        let deptPro = await Models.departmentProperty.find({where : {value: self.id}});
        if(deptPro && deptPro.length > 0){
            department = await Models.department.get(deptPro[0].departmentId);
        }
        return department;
    }

    async destroy(): Promise<boolean>{
        let self = this;
        let dept = await self.getDepartment();
        if(dept){
            await dept.deleteDepartmentProperty();

            try{
                await dept.destroy();
            }catch(e) {
                console.info("删除部门失败",e);
            }
        }

        return true;
    }

    /**
     * @method 
     * @param params 
     */
    async sync(params?:{company?: Company, oaDepartment?: OaDepartment, from?: string}): Promise<Department>{
        console.info(this.name, "department sync begin==================================", this.name);
        if(!params) params = {};
        let self = params.oaDepartment || this;
        let company = self.company;

        let from = params.from;
        if(params.company){
            company = params.company;
        }
        // let type = await company.getOaType();
        /*if(!company){
            let staff = await Staff.getCurrent();
            company = staff.company;
        }*/
        if(!company){
            throw L.ERR.INVALID_ACCESS_ERR();
        }
        let result: Department;

        let defaultDepartment = await company.getDefaultDepartment();
        
        let parentDepartment: Department;    //极端情况：parentDepartment 记录根部门的上级，若不存在，则为本系统的默认部门

        let oaParent = await self.getParent();

        if(!oaParent || !oaParent.id){
            parentDepartment = defaultDepartment;
        }else{
            parentDepartment = await oaParent.getDepartment();
            if(!parentDepartment){
                parentDepartment = defaultDepartment;
            }
        }
        if(parentDepartment || (!parentDepartment && !defaultDepartment)){
            let alreadyDepartment = await self.getDepartment();
            if(alreadyDepartment){
                if(company){
                    alreadyDepartment.company = company;
                }
                if(parentDepartment && parentDepartment.id != alreadyDepartment.id){
                    alreadyDepartment.parent = parentDepartment;
                }
                alreadyDepartment.name = self.name;//同步已有部门信息
                result = await alreadyDepartment.save();
            }else{
                /**
                 * 鲸力系统不存在第三方系统的部门， 则创建，同时注意对于在鲸力系统已经注册的公司，
                 * 此时的根部门及为公司名，同步微信通讯录时无需创建多个根部门
                 */ 
                let dept: Department;
                let depts = await Models.department.find({
                    where: {
                        companyId: company.id,
                        name: self.name
                    }
                });
                if(depts && depts.length) dept = depts[0];
                if (!dept) dept =  Department.create({name: self.name});
                dept.company = company;
                if(parentDepartment && parentDepartment.id != dept.id){
                    dept.parent = parentDepartment;
                }
                if((!parentDepartment && !defaultDepartment)){
                    dept.isDefault = true;
                }
                result = await dept.save();
                await self.saveDepartmentProperty({departmentId: result.id});
            }

            if(!from){
                //2、同步部门下员工
                let oaStaffs = await self.getStaffs();
                let oaStaffsMap = {};
                if (oaStaffs && oaStaffs.length > 0) {
                    for(let item of oaStaffs){
                        oaStaffsMap[item.id] = item;
                        await item.sync({company: company});
                    }
                }

                //3、删除被删除的员工
                let childrenStaffs = await result.getAllStaffs();
                await Promise.all(childrenStaffs.map(async (item) => {
                    let staffProperty = await item.getOaStaffIdProperty();
                    let oaSt;
                    if(staffProperty)
                        oaSt= oaStaffsMap[staffProperty.value];
                    if(!oaSt){
                        try{
                            await item.deleteStaffProperty();

                            item.staffStatus = EStaffStatus.QUIT_JOB;
                            await item.save();

                            let deleteAccount = await Models.account.get(item.accountId);
                            await deleteAccount.destroy();

                            await item.deleteStaffDepartments();
                        }catch (e){
                            console.info("删除员工失败", e);
                        }
                    }else{
                        // oaStaffsMap[staffProperty.value] = null;
                    }
                }));

                //获取oa子部门
                let childrenDepartments = await self.getChildrenDepartments();
         
                let childrenDepartmentsMap = {};
                for(let d = 0; d < childrenDepartments.length; d++){
                    let ld = childrenDepartments[d];
                    childrenDepartmentsMap[ld.id] = ld;
                }

                //4、删除被删除的子部门
                let childrenDepts = await Models.department.all({where: {parentId: result.id}});
                await Promise.all(childrenDepts.map(async (item) => {
                    let deptProperty = await item.getOaDeptIdProperty();
                    let oaDept;
                    if(deptProperty)
                        oaDept= childrenDepartmentsMap[deptProperty.value];
                    if(!oaDept){
                        await item.deleteDepartmentProperty();

                        try{
                            await item.destroy();
                        }catch(e) {
                            console.info("删除部门失败",e);
                        }
                    }else{
                        // childrenDepartmentsMap[deptProperty.value] = null;
                    }
                }));

                //5、递归同步子部门信息
                if(childrenDepartments && childrenDepartments.length > 0){
                    for(let child of childrenDepartments){
                        await child.sync({company: company});
                    }
                }
            }
        }else{
            //父级部门不存在同步父级部门
            // await oaParent.sync({company: company});
        }
        return result;
    }

}