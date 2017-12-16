/**
 * Created by wyl on 16-01-20.
 */
'use strict';
var _ = require("lodash");
import { DB } from '@jingli/database';
let API = require("@jingli/dnode-api");
import L from '@jingli/language';
import { Department, StaffDepartment } from "_types/department";
import { requireParams, clientExport } from '@jingli/dnode-api/dist/src/helper';
import { Models } from '_types/index';
import { FindResult, PaginateInterface } from "common/model/interface";
import { Staff, EStaffStatus, EStaffRole } from "_types/staff";
import { conditionDecorator, condition } from "../_decorator";

const departmentCols = Department['$fieldnames'];
const staffDepartmentCols = StaffDepartment['$fieldnames'];
export default class DepartmentModule {
    /**
     * 创建部门
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["name", "companyId", "parentId"], departmentCols)
    @conditionDecorator([
        { if: condition.isCompanyAdminOrOwner("0.companyId") },
        { if: condition.isCompanyAgency("0.companyId") },
        { if: condition.isCompanyDepartment("0.parentId") }
    ])
    static async createDepartment(params): Promise<Department> {

        let result = await Models.department.find({ where: { name: params.name, companyId: params.companyId } });

        if (result && result.length > 0) {
            throw { code: -1, msg: "该部门名称已存在，请重新设置" };
        }

        var staff = await Staff.getCurrent();

        var department = Department.create(params);

        if (staff) {
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
        { if: condition.isDepartmentAdminOrOwner("0.id") },
        { if: condition.isDepartmentAgency("0.id") }
    ])
    static async deleteDepartment(params): Promise<any> {
        var id = params.id;
        var department = await Models.department.get(params.id);
        let staffs = await department.getStaffs();
        if (staffs && staffs.length > 0) {
            throw { code: -1, msg: '该部门下有' + staffs.length + '位员工，暂不能删除' };
        }

        let childDepartments = await department.getChildDepartments();
        if (childDepartments && childDepartments.length > 0) {
            throw { code: -2, msg: '该部门下有子级部门，暂不能删除' };
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
        { if: condition.isDepartmentAdminOrOwner("0.id") },
        { if: condition.isDepartmentAgency("0.id") }
    ])
    static async updateDepartment(params): Promise<Department> {
        if (params.parentId) {
            let ids = await DepartmentModule.getAllChildDepartmentsId({ parentId: params.id });
            if (ids.indexOf(params.parentId) >= 0) {
                throw L.ERR.INVALID_ARGUMENT("parentId");
            }
        }
        let dept = await Models.department.get(params.id);

        if (params.name) {
            let result = await Models.department.find({ where: { name: params.name, companyId: dept.company.id } });
            if (result && result.length > 0) {
                throw { code: -1, msg: "该部门名称已存在，请重新设置" };
            }
        }
        for (let key in params) {
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
        { if: condition.isDepartmentCompany("0.id") },
        { if: condition.isSelfDepartment("0.id") },
        { if: condition.isDepartmentAgency("0.id") }
    ])
    static async getDepartment(params: { id?: string, companyId?: string }): Promise<Department> {
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
    @requireParams(["where.companyId"], departmentCols.map((v) => 'where.' + v))
    @conditionDecorator([
        { if: condition.isCompanyAdminOrOwner("0.where.companyId") },
        { if: condition.isCompanyAgency("0.where.companyId") },
        { if: condition.isCompanyStaff("0.where.companyId") }
    ])
    static async getDepartments(params): Promise<FindResult> {
        params.order = params.order || [['createdAt', 'desc']];

        let paginate = await Models.department.find(params);
        return { ids: paginate.map((s) => { return s.id; }), count: paginate['total'] };
    }



    /**
     * 得到企业一级部门
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["companyId"])
    @conditionDecorator([
        { if: condition.isCompanyAdminOrOwner("0.companyId") },
        { if: condition.isCompanyAgency("0.companyId") }
    ])
    static async getFirstClassDepartments(params: { companyId: string }): Promise<PaginateInterface<Department>> {
        var staff = await Staff.getCurrent();
        let options: any = {};
        params['parentId'] = null;
        options.where = params;
        options.order = [["created_at", "desc"]];
        if (staff) {
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
        { if: condition.isDepartmentAdminOrOwner("0.parentId") },
        { if: condition.isDepartmentAgency("0.parentId") }
    ])
    static async getChildDepartments(params: { parentId: string, companyId?: string }): Promise<PaginateInterface<Department>> {
        var staff = await Staff.getCurrent();
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];

        if (staff) {

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
        { if: condition.isDepartmentAdminOrOwner("0.parentId") },
        { if: condition.isDepartmentAgency("0.parentId") }
    ])
    static async getAllChildren(params: { parentId: string }) {
        var sql = "with RECURSIVE cte as " +
            "( select a.id,a.name,a.parent_id from department.departments a where id='" + params.parentId + "' " +
            "union all select k.id,k.name,k.parent_id  from department.departments k inner join cte c on c.id = k.parent_id " +
            "where k.deleted_at is null) " +
            "select * from cte";
        let [children, row] = await DB.query(sql);
        return children;
    }

    @requireParams(["parentId"])
    @conditionDecorator([
        { if: condition.isDepartmentAdminOrOwner("0.parentId") },
        { if: condition.isDepartmentAgency("0.parentId") }
    ])
    static async getAllChildDepartments(params: { companyId?: string, parentId: string }) {
        var staff = await Staff.getCurrent();
        if (staff) {
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
        { if: condition.isDepartmentAdminOrOwner("0.parentId") },
        { if: condition.isDepartmentAgency("0.parentId") }
    ])
    static async getAllChildDepartmentsId(params: { parentId: string }): Promise<string[]> {
        var ids = [];
        var sql = "with RECURSIVE cte as " +
            "( select a.id,a.name,a.parent_id from department.departments a where id='" + params.parentId + "' " +
            "union all select k.id,k.name,k.parent_id  from department.departments k inner join cte c on c.id = k.parent_id " +
            "where k.deleted_at is null) " +
            "select * from cte";
        let [children, row] = await DB.query(sql);
        for (var i = 0; i < children.length; i++)
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
        { if: condition.isDepartmentAdminOrOwner("0.departmentId") },
        { if: condition.isDepartmentAgency("0.departmentId") }
    ])
    static async getAllStaffNum(params: { departmentId: string }): Promise<number> {
        let ids = await DepartmentModule.getAllChildDepartmentsId({ parentId: params.departmentId });
        let idsStr = ids.join("','");
        let sql = "select count(*) from" +
            " (select distinct staff_id from department.staff_departments where department_id in ('" + idsStr + "') and deleted_at is null) as a";
        let result = await DB.query(sql);
        return result[0][0].count;
    }

    @clientExport
    static async getStaffs(params: { options?: any, id: string }): Promise<PaginateInterface<Staff>> {
        let currentStaff = await Staff.getCurrent();
        let options = params.options;
        if (!options) options = { where: {} };
        if (!options.where) options.where = {};

        let pagers = await Models.staffDepartment.find({ where: { departmentId: params.id }, order: [['createdAt', 'desc']] });

        let departmentStaffs = [];
        departmentStaffs.push.apply(departmentStaffs, pagers);
        while (pagers.hasNextPage()) {
            let nextPager = await pagers.nextPage();
            departmentStaffs.push.apply(departmentStaffs, nextPager);
            // pagers = nextPager;
        }

        let ids = await Promise.all(departmentStaffs.map(function (t) {
            return t.staffId;
        }));

        options.where.staffStatus = EStaffStatus.ON_JOB;
        options.where.companyId = currentStaff.company.id;
        options.where.id = { $in: ids };
        //姓名Z-A
        if (options.order == 'nameDesc') {
            options.order = "convert_to(name,'gbk') desc";
        }
        //姓名A-Z
        if (options.order == 'nameAsc') {
            options.order = "convert_to(name,'gbk') asc";
        }
        //角色排序
        if (options.order == 'role') {
            options.order = [['roleId', 'asc']];
        }
        //差率标准排序
        if (options.order == 'travelPolicy') {
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
        let _order = options.order;
        if (options.order == 'status') {
            delete options.order;
        }
        //默认按创建时间排序排序
        if (options.order == 'createdAt' || !options.order) {
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

    static async deleteDepartmentByTest(params) {
        await DB.models.Department.destroy({ where: { $or: [{ name: params.name }, { companyId: params.companyId }] } });
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
    static async createStaffDepartment(params): Promise<StaffDepartment> {
        var staffDepartment = StaffDepartment.create(params);
        var already = await Models.staffDepartment.find({ where: { departmentId: params.departmentId, staffId: params.staffId } });
        if (already && already.length > 0) {
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
    static async deleteStaffDepartment(params): Promise<any> {
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
    static async updateStaffDepartment(params): Promise<StaffDepartment> {
        var id = params.id;

        var ah = await Models.staffDepartment.get(id);
        for (var key in params) {
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
    static async getStaffDepartment(params: { id: string }): Promise<StaffDepartment> {
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
    static async getStaffDepartments(params): Promise<FindResult> {
        var staff = await Staff.getCurrent();
        let paginate = await Models.staffDepartment.find(params);
        let ids = paginate.map(function (t) {
            return t.id;
        })
        return { ids: ids, count: paginate['total'] };
    }










    @clientExport
    static async getChildrenDeptBudget(deptId: string) {
        const dept = _.first(await DB.query(`select sum(total_budget) as "budgetSum" from 
        costCenter.costCenterDeploy where parent_id = '${deptId}'`))
        return (dept[0].budgetSum == null ? 0 : dept[0].budgetSum) as number
    }

    @clientExport
    static async setDeptBudget(deptId: string, budget: number, operator: string) {
        const dept = await Models.department.get(deptId)
        if (!dept) throw new L.ERROR_CODE_C(404, '未找到该部门')

        const budgetChange = BudgetChange.create({
            operator,
            department: deptId,
            oldBudget: dept.budget || 0,
            newBudget: budget
        })

        if (dept.parent && dept.parent.budget) {
            // 兄弟部门的预算
            const siblingBudget = await DepartmentModule.getChildrenDeptBudget(dept.parent.id)
            // 超出上级部门预算
            if (budget > dept.parent.budget - siblingBudget)
                throw new L.ERROR_CODE_C(400, '超出上级部门预算')
        }

        // 子部门预算
        const subBudget = await DepartmentModule.getChildrenDeptBudget(deptId)

        if (budget >= subBudget) {
            dept.budget = budget
            await budgetChange.save()
            await dept.save()
            return
        }

        dept.budget = subBudget
        budgetChange.newBudget = subBudget
        await budgetChange.save()
        await dept.save()
    }

    @clientExport
    static async setDeptBudgetEarlyWarning(deptId: string, limitedUse: number, type: number, audienceTypes: number[]) {
        const dept = await Models.department.get(deptId)
        if (!dept) throw new L.ERROR_CODE_C(404, '未找到该部门')

        if (type == 0) {
            limitedUse = dept.budget * limitedUse
        }

        const audiences: string[] = []
        for (let type of audienceTypes) {
            if (type == EAudienceType.MANAGER) {
                if (dept.manager)
                    audiences.push(dept.manager.id)
            } else if (type == EAudienceType.PARENT_MANAGER) {
                const pms = await findParentManagers(dept.parent.id)
                audiences.push(...pms)
            } else if (type == EAudienceType.FINANCE) {
                const finances = await findFinances()
                if (finances.length < 1) continue
                audiences.push(finances[0].id)
            }
        }

        const earlyWarning: EarlyWarning = {
            type, limitedUse, audiences, hasSent: false
        }

        dept.earlyWarning = earlyWarning
        await dept.save()
    }

    @clientExport
    static async notice(deptId: string) {
        // const dept = await Models.department.get(deptId)
        // const parents = await findParents(dept.parent.id)
        // await Promise.all(parents.concat(dept).map(notice))
        return await g(deptId)
    }

    /****************************************StaffDepartment end************************************************/
}


async function notice(dept: Department) {
    if (!dept.earlyWarning) return
    if (dept.earlyWarning.hasSent) return

    if (dept.earlyWarning.type == 0) {
        const expenditure = await getPerYearExpenditure(dept.id)
        if (dept.earlyWarning.limitedUse < expenditure) {
            await sendNotice(dept)
            dept.earlyWarning.hasSent = true
            await dept.save()
        }
    } else {
        const expenditure = await getPerMonthExpenditure()

        if (dept.earlyWarning.limitedUse < expenditure) {
            await sendNotice(dept)
            dept.earlyWarning.hasSent = true
            await dept.save()
        }
    }
}

async function sendNotice(dept: Department) {
    await Promise.all(dept.earlyWarning.audiences.map(audience =>
        API.notify.submitNotify({
            key: 'qm_budget_early_warning',
            userId: audience
        })
    ))
}

async function getPerMonthExpenditure() {
    return 0
}


async function getChildren(deptId: string) {
    const children = await Models.department.find({
        where: { parent_id: deptId }
    })
    return await Promise.all(children.map(c => g(c.id)))
}

async function g(deptId) {
    const dept = await Models.department.get(deptId)
    return {
        dept,
        children: await getChildren(deptId)
    }
}

export async function findChildren(deptId: string): Promise<Array<Department>> {
    const children = await Models.department.find({
        where: { parent_id: deptId }
    })
    return children.length == 0
        ? []
        : [...children, ... await f(children)]
}

async function f([x, ...xs]) {
    return x == void 0
        ? []
        : [... await findChildren(x.id), ... await f(xs)]
}

async function getChildrenPerYearExpenditure(deptId: string) {
    const children = await findChildren(deptId)
    return _.sum(await Promise.all(children.map(c => getPerYearExpenditure(c.id))))
}

async function getPerYearExpenditure(deptId: string) {
    const year = new Date().getFullYear()
    const sql = `select sum(expenditure) expenditure from trip_plan.trip_plans 
    where created_at >= '${year}-01-01' and created_at < '${year + 1}-01-01' 
    and project_id = '${deptId}'`

    const { expenditure } = (await DB.query(sql))[0][0]
    return expenditure || 0
}

async function findParents(deptId: string): Promise<Array<Department>> {
    const dept = await Models.department.get(deptId)
    if (!dept) return []

    return dept.parent == void 0
        ? [dept]
        : [... await findParents(dept.parent.id)]
}

export async function findParentManagers(deptId: string) {
    const dept = await Models.department.get(deptId)
    const { manager, parent } = dept
    if (parent == null && manager == null) return []

    return manager && parent == null
        ? [manager.id]
        : [manager.id, ... await findParentManagers(parent.id)]
}

export async function findFinances() {
    return await Models.staff.find({
        where: { roleId: EStaffRole.FINANCE }
    })
}

// 预警通知人类型

