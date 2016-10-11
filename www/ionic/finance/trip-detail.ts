/**
 * Created by wlh on 2016/10/10.
 */

'use strict';
import {ETripType} from "api/_types/tripPlan";


export async function TripDetailController($scope, $stateParams) {
    let tripPlanId = $stateParams.id;
    let code = $stateParams.code;

    API.require("finance");
    await API.onload();

    let tripPlan = await API.finance.getTripPlan({tripPlanId: tripPlanId, code: code});
    let tripDetails = await API.finance.getTripDetails({tripPlanId: tripPlanId, code: code})

    console.info(tripPlan);
    $scope.tripDetail = tripPlan;

    let trafficBudgets = [];
    let hotelBudgets = [];
    let subsidyBudgets = [];
    let specialApproveBudgets = [];
    let trafficTotalBudget = 0;
    let hotelTotalBudget = 0;
    let subsidyTotalBudget = 0;
    let specialApproveTotalBudget = 0;

    for(let key in tripDetails) {
        if (!/^\d+$/.test(key)) {
            continue;
        }
        let item = tripDetails[key]
        if (item.type == ETripType.BACK_TRIP || item.type == ETripType.OUT_TRIP) {
            trafficBudgets.push(item);
            trafficTotalBudget += item.expenditure;
        }
        if (item.type == ETripType.HOTEL) {
            hotelBudgets.push(item);
            hotelTotalBudget += item.expenditure;
        }
        if (item.type == ETripType.SUBSIDY) {
            subsidyBudgets.push(item);
            subsidyTotalBudget += item.expenditure;
        }
        if (item.type == ETripType.SPECIAL_APPROVE) {
            specialApproveBudgets.push(item);
            specialApproveTotalBudget += item.expenditure;
        }
    }
    $scope.trafficBudgets = trafficBudgets;
    $scope.hotelBudgets = hotelBudgets;
    $scope.subsidyBudgets = subsidyBudgets;
    $scope.specialApproveBudgets = specialApproveBudgets;
    $scope.trafficTotalBudget = trafficTotalBudget;
    $scope.hotelTotalBudget = hotelTotalBudget;
    $scope.subsidyTotalBudget = subsidyTotalBudget
    $scope.specialApproveTotalBudget = specialApproveTotalBudget;
}