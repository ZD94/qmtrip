/**
 * Created by wyl on 16-01-20.
 */
'use strict';
import {DB} from '@jingli/database';
import L from '@jingli/language';
import {Department, StaffDepartment} from "_types/department";
import {requireParams, clientExport} from '@jingli/dnode-api/dist/src/helper';
import { Models } from '_types/index';
import { FindResult, PaginateInterface } from "common/model/interface";
import {Staff, EStaffStatus} from "_types/staff";
import {conditionDecorator, condition} from "../_decorator";

const departmentCols = Department['$fieldnames'];
const staffDepartmentCols = StaffDepartment['$fieldnames'];
class DepartmentModule{
    /**
     * 创建部门
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["name","companyId", "parentId"], departmentCols)
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")},
        {if: condition.isCompanyDepartment("0.parentId")}
    ])
    static async createDepartment (params: any): Promise<Department>{

        let result = await Models.department.find({where: {name: params.name, companyId: params.companyId}});

        if(result && result.length>0){
            throw {code:-1, msg: "该部门名称已存在，请重新设置"};
        }

        var staff = await Staff.getCurrent();

        var department = Department.create(params);

        if(staff){
            var company = staff.company;
            department.company = company;
        }
        return department.save();
    }

    /**
     * 删除部门
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.id")},
        {if: condition.isDepartmentAgency("0.id")}
    ])
    static async deleteDepartment(params: any): Promise<any>{
        var department = await Models.department.get(params.id);
        let staffs = await department.getStaffs();
        if(staffs && staffs.length > 0){
            throw {code: -1, msg: '该部门下有' + staffs.length + '位员工，暂不能删除'};
        }

        let childDepartments = await department.getChildDepartments();
        if(childDepartments && childDepartments.length > 0){
            throw {code: -2, msg: '该部门下有子级部门，暂不能删除'};
        }

        await department.destroy();
        return true;
    }


    /**
     * 更新部门
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], departmentCols)
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.id")},
        {if: condition.isDepartmentAgency("0.id")}
    ])
    static async updateDepartment(params: any): Promise<Department>{
        if(params.parentId){
            let ids = await DepartmentModule.getAllChildDepartmentsId({parentId: params.id});
            if(ids.indexOf(params.parentId) >= 0){
                throw L.ERR.INVALID_ARGUMENT("parentId");
            }
        }
        let dept = await Models.department.get(params.id);

        if(params.name){
            let result = await Models.department.find({where: {name: params.name, companyId: dept.company.id}});
            if(result && result.length>0){
                throw {code:-1, msg: "该部门名称已存在，请重新设置"};
            }
        }
        for(let key in params){
            dept[key] = params[key];
        }
        return dept.save();
    }

    /**
     * 根据id查询部门
     * @param id
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    @conditionDecorator([
        {if: condition.isDepartmentCompany("0.id")},
        {if: condition.isSelfDepartment("0.id")},
        {if: condition.isDepartmentAgency("0.id")}
    ])
    static async getDepartment(params: {id?: string, companyId?: string}): Promise<Department>{
        let id = params.id;
        let dept = await Models.department.get(id);
        return dept;
    };


    /**
     * 根据属性查找部门id
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["where.companyId"], departmentCols.map((v: string) => 'where.'+ v))
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.where.companyId")},
        {if: condition.isCompanyAgency("0.where.companyId")},
        {if: condition.isCompanyStaff("0.where.companyId")}
    ])
    static async getDepartments(params: any) :Promise<FindResult>{
        params.order = params.order || [['createdAt', 'desc']];

        let paginate = await Models.department.find(params);
        return {ids: paginate.map((s)=> {return s.id;}), count: paginate['total']};
    }



    /**
     * 得到企业一级部门
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["companyId"])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async getFirstClassDepartments(params: {companyId: string}): Promise<PaginateInterface<Department> >{
        var staff = await Staff.getCurrent();
        let options: any = {};
        params['parentId'] = null;
        options.where = params;
        options.order = [["created_at", "desc"]];
        if(staff){
            options.where.companyId = staff["companyId"];//只允许查询该企业下的部门
        }

        return Models.department.find(options);

    }

    /**
     * 得到一级子级部门
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["parentId"], ["companyId"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.parentId")},
        {if: condition.isDepartmentAgency("0.parentId")}
    ])
    static async getChildDepartments(params: {parentId: string, companyId?: string}): Promise<PaginateInterface<Department> >{
        var staff = await Staff.getCurrent();
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];

        if(staff){

            params.companyId = staff["companyId"];//只允许查询该企业下的部门
        }

        return Models.department.find(options);
    }

    /**
     * 得到所有子级部门
     * @param params
     * @returns {*}
     */
    @requireParams(["parentId"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.parentId")},
        {if: condition.isDepartmentAgency("0.parentId")}
    ])
    static async getAllChildren(params: {parentId: string}){
        var sql = "with RECURSIVE cte as " +
            "( select a.id,a.name,a.parent_id from department.departments a where id='"+params.parentId+"' " +
            "union all select k.id,k.name,k.parent_id  from department.departments k inner join cte c on c.id = k.parent_id " +
            "where k.deleted_at is null) " +
            "select * from cte";
        let [children] = await DB.query(sql);
        return children;
    }

    @requireParams(["parentId"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.parentId")},
        {if: condition.isDepartmentAgency("0.parentId")}
    ])
    static async getAllChildDepartments(params: {companyId?: string, parentId: string}){
        var staff = await Staff.getCurrent();
        if(staff){
            params.companyId = staff["companyId"];//只允许查询该企业下的部门
        }

        return DepartmentModule.getAllChildren(params);

    }

    /**
     * 得到所有子级部门id数组
     * @param params
     * @returns {*}
     */
    @requireParams(["parentId"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.parentId")},
        {if: condition.isDepartmentAgency("0.parentId")}
    ])
    static async getAllChildDepartmentsId(params: {parentId: string}): Promise<string[]>{
        var ids = [];
        var sql = "with RECURSIVE cte as " +
            "( select a.id,a.name,a.parent_id from department.departments a where id='"+params.parentId+"' " +
            "union all select k.id,k.name,k.parent_id  from department.departments k inner join cte c on c.id = k.parent_id " +
            "where k.deleted_at is null) " +
            "select * from cte";
        let [children] = await DB.query(sql);
        for(var i=0;i<children.length;i++)
            ids.push(children[i].id);
        return ids;
    }

    /**
     * 得到部门下员工总数（包括子部门下的员工）
     * @param params
     * @returns {*}
     */
    @requireParams(["departmentId"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.departmentId")},
        {if: condition.isDepartmentAgency("0.departmentId")}
    ])
    static async getAllStaffNum(params: {departmentId: string}): Promise<number>{
        let ids = await DepartmentModule.getAllChildDepartmentsId({parentId: params.departmentId});
        let idsStr = ids.join("','");
        let sql = "select count(*) from" +
            " (select distinct staff_id from department.staff_departments where department_id in ('"+idsStr+"') and deleted_at is null) as a";
        let result = await DB.query(sql);
        return result[0][0].count;
    }

    @clientExport
    static async getStaffs(params: {options?: any, id: string}): Promise<PaginateInterface<Staff>> {
        let currentStaff = await Staff.getCurrent();
        let options = params.options;
        if (!options) options = {where: {}};
        if(!options.where) options.where = {};

        let pagers = await Models.staffDepartment.find({where: {departmentId: params.id}, order: [['createdAt', 'desc']]});

        let departmentStaffs: any[] = [];
        departmentStaffs.push.apply(departmentStaffs, pagers);
        while(pagers.hasNextPage()){
            let nextPager = await pagers.nextPage();
            departmentStaffs.push.apply(departmentStaffs, nextPager);
            // pagers = nextPager;
        }

        let ids =  await Promise.all(departmentStaffs.map(function(t){
            return t.staffId;
        }));

        options.where.staffStatus = EStaffStatus.ON_JOB;
        options.where.companyId = currentStaff.company.id;
        options.where.id = {$in: ids};
        //姓名Z-A
        if(options.order == 'nameDesc'){
            options.order = "convert_to(name,'gbk') desc";
        }
        //姓名A-Z
        if(options.order == 'nameAsc'){
            options.order = "convert_to(name,'gbk') asc";
        }
        //角色排序
        if(options.order == 'role'){
            options.order = [['roleId', 'asc']];
        }
        //差率标准排序
        if(options.order == 'travelPolicy'){
            options.order = [['travelPolicyId', 'asc']];
        }
        //员工状态
        /*if(options.order == 'status'){
            DB.models.Staff.belongsTo(DB.models.Account, {foreignKey: 'id', targetKey: 'id'});
            options.include = [{
                model: DB.models.Account,
                attributes : []
            }];
            options.order = '"' + 'Account' + '"' + '.status asc';
         }*/
        if(options.order == 'status'){
            delete options.order;
        }
        //默认按创建时间排序排序
        if(options.order == 'createdAt' || !options.order){
            options.order = [['createdAt', 'desc']];
        }
        let staffs = await Models.staff.find(options);

        //取出集合之后排序 不是对全部数据进行排序会出问题
        /*if(_order == 'status'){
            staffs.sort(function(a,b){
                return a.status - b.status;
            })
        }*/
        return staffs;
    }

    static async deleteDepartmentByTest(params: any){
        await DB.models.Department.destroy({where: {$or: [{name: params.name}, {companyId: params.companyId}]}});
        return true;
    }

    /****************************************StaffDepartment begin************************************************/

    /**
     * 创建员工部门记录
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["departmentId", "staffId"], staffDepartmentCols)
    static async createStaffDepartment (params: any) : Promise<StaffDepartment>{
        var staffDepartment = StaffDepartment.create(params);
        var already = await Models.staffDepartment.find({where: {departmentId: params.departmentId, staffId: params.staffId}});
        if(already && already.length>0){
            return already[0];
        }
        var result = await staffDepartment.save();
        return result;
    }


    /**
     * 删除员工部门记录
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async deleteStaffDepartment(params: any) : Promise<any>{
        var id = params.id;
        var ah_delete = await Models.staffDepartment.get(id);

        await ah_delete.destroy();
        return true;
    }


    /**
     * 更新员工部门记录
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], staffDepartmentCols)
    static async updateStaffDepartment(params: any) : Promise<StaffDepartment>{
        var id = params.id;

        var ah = await Models.staffDepartment.get(id);
        for(var key in params){
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询员工部门记录
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getStaffDepartment(params: {id: string}) : Promise<StaffDepartment>{
        let id = params.id;
        var ah = await Models.staffDepartment.get(id);

        return ah;
    };


    /**
     * 根据属性查找员工部门记录
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getStaffDepartments(params: any): Promise<FindResult>{
        let paginate = await Models.staffDepartment.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    /****************************************StaffDepartment end************************************************/
}


export = DepartmentModule;