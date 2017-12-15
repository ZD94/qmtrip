import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import { Models } from '_types';
import { findChildren, findParentManagers, findFinances } from 'api/department';
import { DB } from '@jingli/database';
import * as _ from 'lodash';





export default class CostCenterDeployModule {



    @clientExport
    static async initBudget(budgets) {
        await Promise.all(budgets.map(b => Models.costCenterDeploy.create(b).save()))
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
        const dept = await Models.department.get(costId)
        cost.warningRule = { type, rate }
        
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
        cost.warningPerson = audiences
        await cost.save()
    }

    @clientExport
    static async

}

export enum EAudienceType {
    MANAGER = 0,
    PARENT_MANAGER = 1,
    FINANCE = 2
}