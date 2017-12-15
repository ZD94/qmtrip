import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import { Models } from '_types';
import { findChildren, findParentManagers, findFinances } from 'api/department';
import { DB } from '@jingli/database';
import * as _ from 'lodash';
import { Department } from '_types/department';
import { CostCenterDeploy } from '_types/costCenter';
const API = require('@jingli/dnode-api')





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
        cost.warningRule = { type, rate }
        cost.warningPerson = audienceTypes
        await cost.save()
    }

    @clientExport
    static async f(costId: string) {
        const cost = await Models.costCenterDeploy.get(costId)
        const dept = await Models.department.get(costId)
        if (cost.isSendNotice) return
        const audiences = await getWarningPerson(dept, cost.warningPerson)

        if (cost.warningRule.type == 0) {
            if (cost.warningRule.rate * cost.totalBudget < cost.expendBudget + getPlanExpend()) {
                await sendNotice(audiences)
                cost.isSendNotice = true
                await cost.save()
            }
        } else {
            if (cost.warningRule.rate * cost.totalBudget < cost.expendBudget + getPlanExpend()) {
                await sendNotice(audiences)
                cost.earlyWarning.hasSent = true
                await cost.save()
            }
        }
    }

}

function getPlanExpend(): number { return 0 }

async function sendNotice(audiences: string[]) {
    await Promise.all(audiences.map(audience =>
        API.notify.submitNotify({
            key: 'qm_budget_early_warning',
            userId: audience
        })
    ))
}

async function getWarningPerson(dept: Department, audienceTypes: number[]) {
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
    return audiences
}

export enum EAudienceType {
    MANAGER = 0,
    PARENT_MANAGER = 1,
    FINANCE = 2
}