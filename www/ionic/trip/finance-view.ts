/**
 * Created by wlh on 2016/10/10.
 */

'use strict';

export async function FinanceViewController($scope, $stateParams) {
    let tripPlanId = $stateParams.id;
    let code = $stateParams.code;

    console.info(tripPlanId, code)
}