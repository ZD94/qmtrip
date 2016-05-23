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
    let tripdef = TripDefineFromJson($storage.local.get('tripdef'));
    var today = moment();
    if(today.diff(tripdef.beginDate) > 0){
        tripdef.beginDate = today.startOf('day').hour(9).toDate();
    } else {
        tripdef.beginDate = today.toDate();
    }
    if(moment(tripdef.beginDate).diff(tripdef.endDate) >= 0){
        tripdef.endDate = moment(tripdef.beginDate).startOf('day').hour(18).toDate();
    } else {
        tripdef.endDate = today.add(1, 'days').toDate();
    }
    $storage.local.set('tripdef', tripdef);
    $scope.tripdef = tripdef;
    $scope.$watch('tripdef', function(){
        $storage.local.set('tripdef', $scope.tripdef);
    }, true)

    $scope.calcTripDuration = function(){
        return moment(tripdef.endDate).diff(tripdef.beginDate, 'days') || 1;
    }
    $scope.incTripDuration = function(){
        tripdef.endDate = moment(tripdef.endDate).add(1, 'days').toDate();
        $scope.$applyAsync();
    }
    $scope.decTripDuration = function(){
        var newDate = moment(tripdef.endDate).subtract(1, 'days').toDate();
        if(newDate > tripdef.beginDate){
            tripdef.endDate = newDate;
            $scope.$applyAsync();
        }
    }

    $scope.nextStep = async function() {
        API.require("travelBudget");
        await API.onload();

        let tripdef = $scope.tripdef;
        API.travelBudget.getTravelPolicyBudget({
            originPlace: tripdef.fromPlace,
            destinationPlace: tripdef.place,
            leaveDate: moment(tripdef.beginDate).format('YYYY-MM-DD'),
            goBackDate: moment(tripdef.endDate).format('YYYY-MM-DD'),
            leaveTime: moment(tripdef.beginDate).format('HH:mm'),
            goBackTime: moment(tripdef.endDate).format('HH:mm'),
            isRoundTrip: tripdef.round
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
    console.info(id);
    API.require("travelBudget");
    await API.onload();
    var budget = await API.travelBudget.getBudgetInfo({id: id});
    console.info(budget);
    //
    // var tripdef = TripDefineFromJson($storage.local.get('tripdef'));
    // var staff = Models.staff.get(Cookie.get("user_id"));
    // $scope.policy = staff.getTravelPolicy();
    // $scope.during = moment(tripdef.endDate).diff(tripdef.beginDate, 'days') || 1;
    // $scope.tripdef = tripdef;
    //
    // var budget = await API.travelBudget.getTravelPolicyBudget({
    //     originPlace: tripdef.fromPlace,
    //     destinationPlace: tripdef.place,
    //     leaveDate: moment(tripdef.beginDate).format('YYYY-MM-DD'),
    //     goBackDate: moment(tripdef.endDate).format('YYYY-MM-DD'),
    //     leaveTime: moment(tripdef.beginDate).format('HH:mm'),
    //     goBackTime: moment(tripdef.endDate).format('HH:mm'),
    //     isRoundTrip: false
    // })
    // console.log(budget);

}

export function CitySelectorController($scope){

}

export function CommitedController($scope){

}

export function DetailController($scope){

}

export async function ListController($scope , Models){
    var staff = await Staff.getCurrent();
}