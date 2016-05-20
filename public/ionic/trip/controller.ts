"use strict";

import moment = require('moment');

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
    let tripdef: any = {};
    tripdef = TripDefineFromJson($storage.local.get('tripdef'));
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
        tripdef.endDate = moment(tripdef.endDate).add(1, 'days').toDate();;
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
            originPlace:tripdef.startCityCode || tripdef.fromPlace,
            destinationPlace:tripdef.endCityCode || tripdef.place,
            leaveDate:tripdef.beginDate,
            goBackDate:tripdef.endDate,
            leaveTime:tripdef.startTimeLate,
            goBackTime:tripdef.endTimeLate,
            isRoundTrip:false
        })
            .then(function(result) {
                console.info(result);
                window.location.href = "#/trip/budget";
            })
            .catch(function(err) {
                alert(err.msg || err);
            })
    }
}

export async function BudgetController($scope, $storage){
    var tripdef = TripDefineFromJson($storage.local.get('tripdef'));
    $scope.tripdef = tripdef;

}

export function CitySelectorController($scope){

}

export function CommitedController($scope){

}

export function DetailController($scope){

}

export async function ListController($scope , Models){
    var staff = await Models.staff.get(Cookie.get('user_id'));
}