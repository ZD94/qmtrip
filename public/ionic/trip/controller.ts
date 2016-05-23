"use strict";

import moment = require('moment');
var API = require("common/api");
var Cookie = require('tiny-cookie');
import { Staff } from 'api/_types/staff';


var defaultTrip = {
    beginDate: moment().startOf('day').hour(9).toDate(),
    endDate: moment().startOf('day').hour(18).toDate(),
    place: '',
    reason: '',

    traffic: true,
    fromPlace: '',
    round: true,

    hotel: false,
    hotelPlace: undefined
};
type TripDefine = typeof defaultTrip;
function TripDefineFromJson(obj: any): TripDefine{
    if(obj == undefined)
        return defaultTrip;
    obj.beginDate = new Date(obj.beginDate);
    obj.endDate = new Date(obj.endDate);
    return obj as TripDefine;
}

export function CreateController($scope, $storage){
    let trip;
    try {
        trip= TripDefineFromJson($storage.local.get('trip'));
    } catch(err) {
        trip = {};
    }
    var today = moment();
    if (!trip.beginDate || (new Date(trip.beginDate) < new Date())) {
        trip.beginDate = today.startOf('day').hour(9).toDate();
    }

    if (!trip.endDate || (new Date(trip.beginDate)) >= new Date(trip.endDate)) {
        trip.endDate = moment(trip.beginDate).add(1, 'days').toDate();
    }

    $storage.local.set('trip', trip);
    $scope.trip = trip;
    $scope.$watch('trip', function(){
        $storage.local.set('trip', $scope.trip);
    }, true)

    $scope.calcTripDuration = function(){
        return moment(trip.endDate).diff(trip.beginDate, 'days') || 1;
    }
    $scope.incTripDuration = function(){
        trip.endDate = moment(trip.endDate).add(1, 'days').toDate();
        $scope.$applyAsync();
    }
    $scope.decTripDuration = function(){
        var newDate = moment(trip.endDate).subtract(1, 'days').toDate();
        if(newDate > trip.beginDate){
            trip.endDate = newDate;
            $scope.$applyAsync();
        }
    }

    $scope.nextStep = async function() {
        API.require("travelBudget");
        await API.onload();

        let trip = $scope.trip;
        API.travelBudget.getTravelPolicyBudget({
            originPlace: trip.fromPlace,
            destinationPlace: trip.place,
            leaveDate: moment(trip.beginDate).format('YYYY-MM-DD'),
            goBackDate: moment(trip.endDate).format('YYYY-MM-DD'),
            leaveTime: moment(trip.beginDate).format('HH:mm'),
            goBackTime: moment(trip.endDate).format('HH:mm'),
            isRoundTrip: trip.round,
            isNeedHotel: true,
        })
        .then(function(result) {
            window.location.href = "#/trip/budget?id="+result;
        })
        .catch(function(err) {
            alert(err.msg || err);
        })
    }
}

export async function BudgetController($scope, $storage, Models, $stateParams){

    var id = $stateParams.id;
    API.require("travelBudget");
    await API.onload();
    let result = await API.travelBudget.getBudgetInfo({id: id});
    let budgets = result.budgets;
    let trip = $storage.local.get("trip");
    trip.beginDate = result.query.leaveDate;
    trip.endDate  = result.query.goBackDate;
    trip.createAt = new Date(result.createAt);
    $scope.trip = trip;
    //补助,现在是0,后续可能会直接加入到预算中
    let otherBudget = {price: 0, type: 'other', itemType: 'other'};
    let isHasOther = false;
    let totalPrice: number = 0;
    for(let budget of budgets) {
        if (budget.itemType == 'other') {
            isHasOther = true;
            break;
        }
    }
    for(let budget of budgets) {
        if (budget.price <= 0) {
            totalPrice = -1;
            break;
        }
        totalPrice += budget.price;
    }
    $scope.totalPrice = totalPrice;
    let duringDays = moment(trip.endDate).diff(moment(trip.beginDate), 'days');
    $scope.duringDays = duringDays;

    if (!isHasOther) {
        budgets.push(otherBudget);
    }
    $scope.budgets = budgets;
}

export function CitySelectorController($scope){

}

export function CommitedController($scope){

}

export function DetailController($scope){

}

export async function ListController($scope , Models){
    var staff = await Staff.getCurrent();
    console.info(Models);
    var list = await Models.tripPlan.find({});
    console.info(list);
    $scope.enterdetail = function(tripid){
        window.location.href = "#/trip/listdetail?tripid="+tripid;
    }
}