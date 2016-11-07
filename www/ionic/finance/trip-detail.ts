/**
 * Created by wlh on 2016/10/10.
 */

'use strict';
import {ETripType} from "api/_types/tripPlan";
import {
    TripDetailTraffic, TripDetailHotel, TripDetailSubsidy,
    TripDetailSpecial
} from "../../../api/_types/tripPlan/tripDetailInfo";


export async function TripDetailController($scope, $stateParams, Models) {
    require('./style.scss');
    let tripPlanId = $stateParams.id;
    let code = $stateParams.code;

    API.require("finance");
    await API.onload();

    let tripPlan = await API.finance.getTripPlan({tripPlanId: tripPlanId, code: code});
    let tripDetails = await API.finance.getTripDetails({tripPlanId: tripPlanId, code: code})
    let staff = await API.finance.getTripPlanStaff({tripPlanId: tripPlanId, code: code});
    $scope.tripDetail = tripPlan;
    $scope.staff = staff;

    let trafficBudgets = [];
    let hotelBudgets = [];
    let subsidyBudgets = [];
    let specialApproveBudgets = [];
    let trafficTotalBudget = 0;
    let hotelTotalBudget = 0;
    let subsidyTotalBudget = 0;
    let specialApproveTotalBudget = 0;

    let _tripDetails = [];
    for(let key in tripDetails) {
        if (!/^\d+$/.test(key)) {
            continue;
        }
        let _detail = tripDetails[key];
        let detail = await API.finance.getTripDetail({tripPlanId: tripPlanId, code: code, tripDetailId: _detail.id});
        if (_detail instanceof TripDetailTraffic) {
            detail['deptCity'] = _detail.deptCity;
            detail['deptDateTime'] = _detail.deptDateTime;
            detail['arrivalCity'] = _detail.arrivalCity;
            detail['arrivalDateTime'] = _detail.arrivalDateTime;
            detail['cabin'] = _detail.cabin;
            detail['invoiceType'] = _detail.invoiceType;
        } else if (_detail instanceof TripDetailHotel) {
            detail['checkInDate'] = _detail.checkInDate;
            detail['checkOutDate'] = _detail.checkOutDate;
            detail['city'] = _detail['city'];
        } else if (_detail instanceof TripDetailSubsidy) {
            detail['hasFirstDaySubsidy'] = _detail.hasFirstDaySubsidy;
            detail['lasLastDaySubsidy'] = _detail.hasLastDaySubsidy;
            detail['startDateTime'] = _detail.startDateTime;
            detail['endDateTime'] = _detail.endDateTime;
            detail['subsidyMoney'] = _detail.subsidyMoney;
        } else if (_detail instanceof TripDetailSpecial) {
            detail['deptDateTime'] = _detail.deptDateTime;
            detail['deptCity'] = _detail.deptCity;
            detail['arrivalCity'] = _detail.arrivalCity;
            detail['arrivalDateTime'] = _detail.arrivalDateTime;
        }
        _tripDetails.push(detail);
    }

    _tripDetails.forEach( (item) => {
        if ([ETripType.BACK_TRIP, ETripType.OUT_TRIP].indexOf(item.type) >= 0) {
            trafficBudgets.push(item);
            trafficTotalBudget += item.expenditure;
        }
        if (item.type == ETripType.HOTEL) {
            hotelBudgets.push(item);
            hotelTotalBudget += item.expenditure;
        }
        if (item.type == ETripType.SUBSIDY) {
            subsidyBudgets.push(item);
            subsidyTotalBudget += item.expenditure || item.budget;
        }
        if (item.type == ETripType.SPECIAL_APPROVE) {
            specialApproveBudgets.push(item);
            specialApproveTotalBudget += item.expenditure;
        }
    })

    $scope.trafficBudgets = trafficBudgets;
    $scope.hotelBudgets = hotelBudgets;
    $scope.subsidyBudgets = subsidyBudgets;
    $scope.specialApproveBudgets = specialApproveBudgets;
    $scope.trafficTotalBudget = trafficTotalBudget;
    $scope.hotelTotalBudget = hotelTotalBudget;
    $scope.subsidyTotalBudget = subsidyTotalBudget
    $scope.specialApproveTotalBudget = specialApproveTotalBudget;
}