'use strict';
import { Models } from "_types/index";
var request = require("request-promise");
import { clientExport, requireParams } from "@jingli/dnode-api/dist/src/helper";
import { BudgetLog, CostCenter, CostCenterDeploy, ECostCenterType } from "_types/costCenter";
import { FindResult } from "common/model/interface";
import { findParentManagers } from 'api/department';
import { Department } from '_types/department';
import { EStaffRole } from '_types/staff';
const API = require('@jingli/dnode-api');

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
    static async initBudget(budgets) {
        const promiseAry = []
        for (let budget of budgets) {
            if (!await Models.costCenter.get(budget.id)) {
                promiseAry.push(CostCenter.create({ id: budget.id, type: ECostCenterType.DEPARTMENT }).save())
            }
            const costCenterDeploy = await Models.costCenterDeploy.get(budget.id)
            if (costCenterDeploy == void 0) {
                promiseAry.push(CostCenterDeploy.create({ ...budget, beginDate: new Date, endDate: new Date }).save())
            } else {
                Object.keys(budget)
                    .forEach(key => { costCenterDeploy[key] = budget[key] })
                promiseAry.push(costCenterDeploy.save())
            }
        }
        await Promise.all(promiseAry)
    }

    @clientExport
    static async changeBudget(budgets: any[]) {
        for (let budget of budgets) {
            const cost = await Models.costCenterDeploy.get(budget.id)
            cost.selfTempBudget = budget.selfTempBudget
            await cost.save()
        }
    }

    @clientExport
    static async setEarlyWarning(costId: string, type: number, rate: number, audienceTypes: number[]) {
        const cost = await Models.costCenterDeploy.get(costId)
        cost.warningRule = { type, rate }
        cost.warningPerson = audienceTypes
        await cost.save()
    }

    @clientExport
    static async f(costId: string) {
        const cost = await Models.costCenterDeploy.get(costId)
        await cost.checkoutBudget()
    }
}


async function getPerMonthExpenditure(costId: string) {

}
