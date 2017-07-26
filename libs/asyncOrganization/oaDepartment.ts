/**
 * Created by wangyali on 2017/7/6.
 */
import {Department} from "_types/department";
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

    async sync(params?:{company?: Company, oaDepartment?: OaDepartment}): Promise<Department>{
        if(!params) params = {};
        let self = params.oaDepartment || this;
        let company = self.company;
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

        let parentDepartment: Department;
        let oaParent = await self.getParent();

        if(!oaParent){
            parentDepartment = defaultDepartment;
        }else{
            parentDepartment = await oaParent.getDepartment();
            //此处怎么解决
            if(!parentDepartment){
                parentDepartment = defaultDepartment;
            }
        }

        if(parentDepartment){
            let alreadyDepartment = await self.getDepartment();
            if(alreadyDepartment){
                if(company){
                    alreadyDepartment.company = company;
                }
                alreadyDepartment.parent = parentDepartment;
                alreadyDepartment.name = self.name;//同步已有部门信息
                result = await alreadyDepartment.save();
            }else{
                // 不存在，添加
                let dept =  Department.create({name: self.name});
                dept.company = company;
                dept.parent = parentDepartment;
                result = await dept.save();
                await self.saveDepartmentProperty({departmentId: result.id});
            }

            //2、同步部门下员工
            let oaStaffs = await self.getStaffs();
            let oaStaffsMap = {};
            if (oaStaffs && oaStaffs.length > 0) {
                await Promise.all(oaStaffs.map(async (item) => {
                    oaStaffsMap[item.id] = item;
                    let ret = await item.sync({company: company});
                }))
            }

            //3、删除被删除的员工
            let childrenStaffs = await result.getAllStaffs();
            await Promise.all(childrenStaffs.map(async (item) => {
                let staffProperty = await item.getOaStaffIdProperty();
                let oaSt = oaStaffsMap[staffProperty.value];
                if(!oaSt){
                    await item.deleteStaffProperty();

                    try{
                        await item.destroy();
                    }catch (e){
                        console.info("删除员工失败", e);
                    }
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
                let oaDept = childrenDepartmentsMap[deptProperty.value];
                if(!oaDept){
                    await item.deleteDepartmentProperty();

                    try{
                        await item.destroy();
                    }catch(e) {
                        console.info("删除部门失败",e);
                    }
                }
            }));

            //5、递归同步子部门信息
            if(childrenDepartments && childrenDepartments.length > 0){
                await Promise.all(childrenDepartments.map(async (item) => {
                    await this.sync({company: company, oaDepartment: item});
                }))
            }

        }else{
            //父级部门不存在同步父级部门
            // await oaParent.sync({company: company});
        }

        return result;
    }

}