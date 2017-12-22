'use strict';
import { Models } from "_types/index";
var request = require("request-promise");
import { clientExport, requireParams } from "@jingli/dnode-api/dist/src/helper";
import { BudgetLog, CostCenter, CostCenterDeploy, ECostCenterType, BUDGET_CHANGE_TYPE } from "_types/costCenter";
import { FindResult, PaginateInterface } from "common/model/interface";
import { findParentManagers, findChildren } from 'api/department';
import { Department } from '_types/department';
import { EStaffRole } from '_types/staff';
import { DB } from '@jingli/database';
import { L } from '@jingli/language';
import { when } from 'q';
const API = require('@jingli/dnode-api');
const _ = require('lodash/fp')

export default class CostCenterModule {

    /**
     * 创建成本中心记录
     * @param data
     * @returns {*}
     */
    @clientExport
    async createCostCenter(params): Promise<CostCenter> {
        var costCenter = CostCenter.create(params);
        var result = await costCenter.save();
        return result;
    }


    /**
     * 删除成本中心记录
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    async deleteCostCenter(params): Promise<boolean> {
        var id = params.id;
        var ah_delete = await Models.costCenter.get(id);

        await ah_delete.destroy();
        return true;
    }


    /**
     * 更新成本中心记录
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    async updateCostCenter(params): Promise<CostCenter> {
        var id = params.id;

        var ah = await Models.costCenter.get(id);
        for (var key in params) {
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询成本中心记录
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    async getCostCenter(params: { id: string }): Promise<CostCenter> {
        let id = params.id;
        var ah = await Models.costCenter.get(id);

        return ah;
    };


    /**
     * 根据属性查找成本中心记录
     * @param params
     * @returns {*}
     */
    @clientExport
    async getCostCenters(params): Promise<FindResult> {
        let paginate = await Models.costCenter.find(params);
        let ids = paginate.map(function (t) {
            return t.id;
        })
        return { ids: ids, count: paginate['total'] };
    }

    /****************************************CostCenterDeploy begin************************************************/

    /**
     * 创建成本中心配置记录
     * @param data
     * @returns {*}
     */
    @clientExport
    async createCostCenterDeploy(params): Promise<CostCenterDeploy> {
        var costCenterDeploy = CostCenterDeploy.create(params);
        var result = await costCenterDeploy.save();
        return result;
    }


    /**
     * 删除成本中心配置记录
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    async deleteCostCenterDeploy(params): Promise<any> {
        var id = params.id;
        var ah_delete = await Models.costCenterDeploy.get(id);

        await ah_delete.destroy();
        return true;
    }


    /**
     * 更新成本中心配置记录
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    async updateCostCenterDeploy(params): Promise<CostCenterDeploy> {
        var id = params.id;

        var ah = await Models.costCenterDeploy.get(id);
        for (var key in params) {
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询成本中心配置记录
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    async getCostCenterDeploy(params: { id: string }): Promise<CostCenterDeploy> {
        let id = params.id;
        var ah = await Models.costCenterDeploy.get(id);

        return ah;
    };


    /**
     * 根据属性查找成本中心配置记录
     * @param params
     * @returns {*}
     */
    @clientExport
    async getCostCenterDeploys(params): Promise<FindResult> {
        let paginate = await Models.costCenterDeploy.find(params);
        let ids = paginate.map(function (t) {
            return t.id;
        })
        return { ids: ids, count: paginate['total'] };
    }

    /****************************************CostCenterDeploy end************************************************/

    /****************************************BudgetLog begin************************************************/

    /**
     * 创建项目预算记录
     * @param data
     * @returns {*}
     */
    @clientExport
    async createBudgetLog(params): Promise<BudgetLog> {
        var budgetLog = BudgetLog.create(params);
        var result = await budgetLog.save();
        return result;
    }


    /**
     * 删除项目预算记录
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    async deleteBudgetLog(params): Promise<any> {
        var id = params.id;
        var ah_delete = await Models.budgetLog.get(id);

        await ah_delete.destroy();
        return true;
    }


    /**
     * 更新项目预算记录
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    async updateBudgetLog(params): Promise<BudgetLog> {
        var id = params.id;

        var ah = await Models.budgetLog.get(id);
        for (var key in params) {
            ah[key] = params[key];
        }
        return ah.save();
    }

    /**
     * 根据id查询项目预算记录
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    async getBudgetLog(params: { id: string }): Promise<BudgetLog> {
        let id = params.id;
        var ah = await Models.budgetLog.get(id);

        return ah;
    };


    /**
     * 根据属性查找项目预算记录
     * @param params
     * @returns {*}
     */
    @clientExport
    async getBudgetLogs(params): Promise<FindResult> {
        let paginate = await Models.budgetLog.find(params);
        let ids = paginate.map(function (t) {
            return t.id;
        })
        return { ids: ids, count: paginate['total'] };
    }

    /****************************************BudgetLog end************************************************/

    @clientExport
    static async appendBudget(costId: string, budget: number) {
        // const cost = await Models.costCenterDeploy.get(costId)
        const log = BudgetLog.create({ costCenterId: costId, value: budget, type: BUDGET_CHANGE_TYPE.APPEND_BUDGET })
        // if (!cost) throw new L.ERROR_CODE_C(404, '该部门尚未设置预算')
        // cost.totalTempBudget = cost.totalBudget += budget
        // await cost.save()
        await log.save()
    }

    @clientExport
    static async listDeptBudget(deptId: string, period: { start: Date, end: Date }) {
        const children = await findChildren(deptId)
        const where = { beginDate: { $lte: period.start }, endDate: { $gte: period.end } }
        const costs = await Promise.all([...children.map(c => Models.costCenterDeploy.find({ where: { ...where, costCenterId: c.id } })),
        Models.costCenterDeploy.find({ where: { ...where, costCenterId: deptId } })])        
        return costs.filter(p => p.filter(_.identity).length > 0)
    }

    @clientExport
    static async initBudget(budgets: any[], period: { start: Date, end: Date }) {
        const promiseAry = []
        for (let budget of budgets) {
            const { id } = budget
            delete budget.id

            const isCreated = (await Models.costCenter.get(id)) == void 0
            if (isCreated) {
                promiseAry.push(CostCenter.create({ id, type: ECostCenterType.DEPARTMENT }).save())
            }

            const costCenterDeploy = await Models.costCenterDeploy.find({
                where: { costCenterId: id, beginDate: period.start, endDate: period.end }
            })
            if (costCenterDeploy.length < 1) {
                promiseAry.push(CostCenterDeploy.create({ costCenterId: id, ...budget, beginDate: period.start, endDate: period.end }).save())
            }
        }
        await Promise.all(promiseAry)
    }

    @clientExport
    static async changeBudget(costId: string, budgets: any[], appendBudget: number = 0, period: { start: Date, end: Date }) {
        const tempSum = _.sum(_.map(_.prop('selfTempBudget'), budgets)),
            where = { costCenterId: costId, beginDate: { $lte: period.start }, endDate: { $gte: period.end } }
        const rootCost = _.first(await Models.costCenterDeploy.find({ where }))

        if (tempSum != rootCost.totalTempBudget + appendBudget) throw new L.ERROR_CODE_C(400, '超出总预算')

        for (let b of budgets) {
            const cost = _.first(await Models.costCenterDeploy.find({ where: { ...where, costCenterId: b.id } }))
            if (cost.selfTempBudget != b.selfTempBudget) {
                cost.selfTempBudget = b.selfTempBudget
                // log
            }
            cost.totalTempBudget = b.totalTempBudget
            await cost.save()
        }
    }

    @clientExport
    static async applyConf(costId: string, period: { start: Date, end: Date }) {
        const where = { costCenterId: costId, beginDate: { $lte: period.start }, endDate: { $gte: period.end } }
        const root = _.first(await Models.costCenterDeploy.find({ where }))
        let totalBudget = 0
        const children = await findChildren(costId)
        for (let c of children) {
            const cost = _.first(await Models.costCenterDeploy.find({ where: { ...where, costCenterId: c.id } }))
            if (!cost) continue
            cost.selfBudget = cost.selfTempBudget
            const cs = await c.getChildDepartments()
            if (cs.length <= 0) {
                cost.totalBudget = cost.selfTempBudget
            } else {
                cost.totalBudget = await getTotalTempBudgetSumOf(cs.map(c => c.id), period) + cost.selfTempBudget
            }
            totalBudget += cost.selfBudget
            await cost.save()
        }
        root.selfBudget = root.selfTempBudget
        root.totalBudget = totalBudget + root.selfBudget
        await root.save()
    }

    @clientExport
    static async setEarlyWarning(costId: string,
        setting: { type: number, rate: number, audienceTypes: number[] },
        period: { start: Date, end: Date }) {
        const cost = _.first(await Models.costCenterDeploy.find({
            where: {
                costCenterId: costId,
                beginDate: { $lte: period.start },
                endDate: { $gte: period.end }
            }
        }))
        cost.warningPerson = setting.audienceTypes
        cost.warningRule = { type: setting.type, rate: setting.rate }
        await cost.save()
    }

    @clientExport
    static async f(costId: string) {
        const cost = await Models.costCenterDeploy.get(costId)
        await cost.checkoutBudget()
    }
}

async function getChildrenExpend(deptId: string) {
    const childrenIds = await getChildrenDeptIds(deptId, )
    return await getTotalTempBudgetSumOf(childrenIds)
}


async function getChildrenDeptIds(parentId: string, except?: string): Promise<string[]> {
    const $and = except && { id: { $ne: except } }
    const departments = await Models.department.find({
        where: {
            parent_id: parentId,
            $and
        },
        attributes: ['id']
    })
    return departments.map(d => d.id)
}

async function getTotalTempBudgetSumOf(costIds: string[], period?) {
    const ids = costIds.map(id => `'${id}'`).join(',')
    const sql = `select sum(total_temp_budget) as sum from 
        cost_center.cost_center_deploys where id in (${ids}) 
        and begin_date <= '${period.start}' and end_date >= '${period.end}'`
    const res = (await DB.query(sql))[0][0]
    return (res && res.sum) || 0
}

async function getPerMonthExpenditure(costId: string) {

}
