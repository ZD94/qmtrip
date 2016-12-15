/**
 * Created by seven on 2016/12/15.
 */
"use strict";
import { enumPlaneLevelToStr } from "api/_types/travelPolicy";

export async function ShowpolicyController($scope, Models, $stateParams){
    let policyId = $stateParams.policyId;
    let travelPolicy = await Models.travelPolicy.get(policyId);
    let subsidies = await travelPolicy.getSubsidyTemplates();
    $scope.travelPolicy = travelPolicy;
    $scope.subsidies = subsidies;
    $scope.enumPlaneLevelToStr = enumPlaneLevelToStr;
    console.info(travelPolicy);
    console.info($scope.subsidies);
    console.info(enumPlaneLevelToStr(travelPolicy.planeLevels));
}