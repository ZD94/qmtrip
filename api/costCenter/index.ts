'use strict';
import {Models} from "_types/index";
var request = require("request-promise");
import {clientExport, requireParams} from "@jingli/dnode-api/dist/src/helper";
import { BudgetLog, CostCenter } from "_types/costCenter";
import {FindResult} from "common/model/interface";

export class CostCenterModule{

    /**
     * 创建成本中心记录
     * @param data
     * @returns {*}
     */
    @clientExport
    async createCostCenter (params) : Promise<CostCenter>{
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
    async deleteCostCenter(params) : Promise<boolean>{
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
    async updateCostCenter(params) : Promise<CostCenter>{
        var id = params.id;

        var ah = await Models.costCenter.get(id);
        for(var key in params){
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
    async getCostCenter(params: {id: string}) : Promise<CostCenter>{
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
    async getCostCenters(params): Promise<FindResult>{
        let paginate = await Models.costCenter.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    /****************************************BudgetLog begin************************************************/

    /**
     * 创建项目预算记录
     * @param data
     * @returns {*}
     */
    @clientExport
    async createBudgetLog (params) : Promise<BudgetLog>{
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
    async deleteBudgetLog(params) : Promise<any>{
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
    async updateBudgetLog(params) : Promise<BudgetLog>{
        var id = params.id;

        var ah = await Models.budgetLog.get(id);
        for(var key in params){
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
    async getBudgetLog(params: {id: string}) : Promise<BudgetLog>{
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
    async getBudgetLogs(params): Promise<FindResult>{
        let paginate = await Models.budgetLog.find(params);
        let ids =  paginate.map(function(t){
            return t.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    /****************************************BudgetLog end************************************************/
}

let costCenterModule = new CostCenterModule();
export default costCenterModule;