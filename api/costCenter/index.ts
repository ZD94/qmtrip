'use strict';
import { Models } from "_types/index";
import { clientExport, requireParams } from "@jingli/dnode-api/dist/src/helper";
import { BudgetLog, CostCenter, CostCenterDeploy, ECostCenterType, BUDGET_CHANGE_TYPE } from "_types/costCenter";
import { FindResult } from "common/model/interface";
import { findChildren } from 'api/department';
import { Department } from '_types/department';
import { DB } from '@jingli/database';
import { L } from '@jingli/language';
const _ = require('lodash/fp')
const moment = require('moment')

export default class CostCenterModule {

    /**
     * 创建成本中心记录
     * @param data
     * @returns {*}
     */
    @clientExport
    async createCostCenter(params: Object): Promise<CostCenter> {
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
    async deleteCostCenter(params: {id: string}): Promise<boolean> {
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
    async updateCostCenter(params: any): Promise<CostCenter> {
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
    async getCostCenters(params: any): Promise<FindResult> {
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
    async createCostCenterDeploy(params: Object): Promise<CostCenterDeploy> {
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
    async deleteCostCenterDeploy(params: {id: string}): Promise<any> {
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
    async updateCostCenterDeploy(params: any): Promise<CostCenterDeploy> {
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
    async getCostCenterDeploys(params: any): Promise<FindResult> {
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
    async createBudgetLog(params: Object): Promise<BudgetLog> {
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
    async deleteBudgetLog(params: {id: string}): Promise<any> {
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
    async updateBudgetLog(params: any): Promise<BudgetLog> {
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
    static async getBudgetLog(params: { id: string }): Promise<BudgetLog> {
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
    static async getBudgetLogs(params: any): Promise<FindResult> {
        let paginate = await Models.budgetLog.find(params);
        let ids = paginate.map(function (t) {
            return t.id;
        })
        return { ids: ids, count: paginate['total'] };
    }

    /****************************************BudgetLog end************************************************/

    /**
     * 获取追加预算
     */
    @clientExport
    static async getAppendBudget(costId: string, showTime: Date) {
        return _.first(await Models.budgetLog.find({
            where: { costCenterId: costId, type: BUDGET_CHANGE_TYPE.APPEND_BUDGET, showTime },
            order: [['created_at', 'desc']]
        }))
    }

    /**
     * 追加预算
     * @param costId 
     * @param operator 
     * @param budget 
     */
    @clientExport
    static async appendBudget({ costId, operator, budget, showTime }: { costId: string, operator: string, budget: number, showTime: Date }) {
        const rootDept = await Models.department.get(costId)
        const log = BudgetLog.create({
            companyId: rootDept.company.id, costCenterId: costId, value: budget,
            type: BUDGET_CHANGE_TYPE.APPEND_BUDGET, staffId: operator, remark: '追加总预算',
            showTime: moment(showTime).format()
        })
        await log.save()
    }

    /**
     * 根据部门获取预算列表
     * @param deptId 
     * @param period 
     */
    @clientExport
    static async listDeptBudget(deptId: string, period: { start: Date, end: Date }) {
        const children = await findChildren(deptId)
        const where = constructWhereCondition(deptId, period)
        const costs = await Promise.all([
            ...children.map(c => Models.costCenterDeploy.find({ where: { ...where, costCenterId: c.id } })),
            Models.costCenterDeploy.find({ where })
        ])
        const uniqCosts: CostCenterDeploy[] = _.compose(_.compact, _.map(_.first))(costs)
        const planExpends = await Promise.all(uniqCosts.map(cost => cost.getPlanBudget({ startDay: period.start, endDay: period.end })))
        return _.zipWith((cost: CostCenterDeploy, planExpend: number) => {
            return { ...cost.toJSON(), expendBudget: cost.expendBudget + planExpend }
        }, uniqCosts, planExpends)
    }

    /**
     * 初始化预算
     * @param param0 
     */
    @clientExport
    static async initBudget({ budgets, period, operator, costId }: ICostCenterDeploy) {
        const promises: Promise<any>[] = []
        const where = constructWhereCondition(null, period)
        let totalBudget = 0;
        for (let budget of budgets) {
            const { id } = budget
            delete budget.id
            totalBudget += budget.selfTempBudget;
            const nonCreated = (await Models.costCenter.get(id)) == void 0
            if (nonCreated) {
                const dept = await Models.department.get(id)
                promises.push(CostCenter.create({ id, type: ECostCenterType.DEPARTMENT, name: dept.name }).save())
            }

            const costCenterDeploys = await Models.costCenterDeploy.find({ where: { ...where, costCenterId: id } })
            if (costCenterDeploys.length < 1) {
                promises.push(CostCenterDeploy.create({ costCenterId: id, ...budget, beginDate: period.start, endDate: period.end }).save())
            }
        }
        const rootDept = await Models.department.get(costId)
        promises.push(BudgetLog.create({
            companyId: rootDept.company.id, costCenterId: costId, value: totalBudget,
            type: BUDGET_CHANGE_TYPE.ADD_BUDGET, staffId: operator, remark: '初始化预算',
            showTime: moment(period.start).format()
        }).save())
        await DB.transaction(async function () {
            await Promise.all(promises)
        })
    }

    /**
     * 调整预算
     * @param param0 
     */
    @clientExport
    static async changeBudget({ budgets, period, operator, costId, appendBudget }: ICostCenterDeploy) {
        const tempSum = _.compose(_.sum, _.map(_.prop('selfTempBudget')))(budgets),
            where = constructWhereCondition(costId, period)
        const rootCost = _.first(await Models.costCenterDeploy.find({ where }))

        if (tempSum != rootCost.totalTempBudget + appendBudget) throw new L.ERROR_CODE_C(400, '超出总预算')

        await DB.transaction(async function () {
            for (let budget of budgets) {
                const { id } = budget
                const costCenter = await Models.costCenter.get(id)
                let dept: Department
                if (!costCenter) {
                    dept = dept || await Models.department.get(id)
                    CostCenter.create({ id, type: ECostCenterType.DEPARTMENT, name: dept.name }).save()
                }
                const cost: CostCenterDeploy = _.first(await Models.costCenterDeploy.find({ where: { ...where, costCenterId: id } }))
                if (!cost) {
                    delete budget.id
                    dept = dept || await Models.department.get(id)
                    await CostCenterDeploy.create({ costCenterId: id, ...budget, beginDate: period.start, endDate: period.end }).save()
                    continue
                }
                if (cost.selfTempBudget != budget.selfTempBudget) {
                    // log
                    if (!dept) dept = await Models.department.get(id)
                    await BudgetLog.create({
                        companyId: dept.company.id, costCenterId: id, value: budget.selfTempBudget - cost.selfTempBudget,
                        type: BUDGET_CHANGE_TYPE.CHANGE_BUDGET, staffId: operator, remark: `${dept.name}调整预算`,
                        showTime: moment(period.start).format()
                    }).save()
                    cost.selfTempBudget = budget.selfTempBudget
                }
                cost.totalTempBudget = budget.totalTempBudget
                await cost.save()
            }
        })
    }

    /**
     * 启用预算设置
     * @param costId 
     * @param period 
     * @param operator 
     */
    @clientExport
    static async applyConf(costId: string, period: { start: Date, end: Date }, operator: string) {
        const where = constructWhereCondition(costId, period)
        const root = _.first(await Models.costCenterDeploy.find({ where }))
        let totalBudget = 0
        const children = await findChildren(costId)
        const promises: Promise<any>[] = []
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
            promises.push(cost.save())
        }
        root.selfBudget = root.selfTempBudget
        root.totalBudget = totalBudget + root.selfBudget
        const rootDept = await Models.department.get(costId)
        promises.push(BudgetLog.create({
            companyId: rootDept.company.id, costCenterId: costId, value: totalBudget + root.selfBudget,
            type: BUDGET_CHANGE_TYPE.APPLY_BUDGET, staffId: operator, remark: '新预算启用',
            showTime: moment(period.start).format()
        }).save())
        promises.push(root.save())
        await DB.transaction(async function () {
            await Promise.all(promises);
        })
    }

    @clientExport
    static async setEarlyWarning(costId: string,
        setting: { type: number, rate: number, audienceTypes: number[] },
        period?: { start: Date, end: Date }) {
        let cost: CostCenterDeploy;
        if (period) {
            cost = _.first(await Models.costCenterDeploy.find({ where: constructWhereCondition(costId, period) }));
        } else {
            cost = _.first(await Models.costCenterDeploy.find({ where: { costCenterId: costId } }));
        }
        cost.warningPerson = setting.audienceTypes
        cost.warningRule = { type: setting.type, rate: setting.rate }
        cost.isSendNotice = false;
        await cost.save()
    }
}

async function getTotalTempBudgetSumOf(costIds: string[], period: { start: Date, end: Date } ) {
    const ids = costIds.map(id => `'${id}'`).join(',')
    var sql = `select sum(total_temp_budget) as sum from 
        cost_center.cost_center_deploys where cost_center_id in (${ids})`;
    if(period) 
        sql += ` and begin_date >= '${add8Hours(period.start)}' and end_date <= '${add8Hours(period.end)}'`;
    
    const res = (await DB.query(sql))[0][0]
    return (res && res.sum) || 0
}

function constructWhereCondition(costId: string, period: { start: Date, end: Date }) {
    return {
        costCenterId: costId,
        beginDate: { $gte: add8Hours(period.start) },
        endDate: { $lte: add8Hours(period.end) }
    }
}

function add8Hours(time: Date) {
    return moment(time).add(8, 'h').format()
}

export interface IBudget {
    id: string,
    totalTempBudget: number,
    selfTempBudget: number
}

export interface ICostCenterDeploy {
    costId: string,
    budgets: IBudget[],
    period: { start: Date, end: Date },
    operator: string,
    appendBudget?: number
}
