"use strict";

var test2 = module.exports = {}
API.require("staff");

API.require("tripPlan");
API.require("travelPolicy");
test2.PagesController = function($scope){
	// alert(1);
	API.onload(function(){
		var params = {page:$scope.page||1,perPage:20};
		var initPlanlist = $scope.initPlanlist = function() {
            API.onload(function(){
                if ($scope.purposename != '' && $scope.purposename != undefined) {
                    params.description = {$like: '%'+ $scope.purposename + '%'};
                }
                if ($scope.emailOrName != '' && $scope.emailOrName != undefined) {
                    params.emailOrName = $scope.emailOrName;
                }
                if($scope.start_time) {
                    params.startTime = $scope.start_time;
                }

                if($scope.end_time) {
                    params.endTime = $scope.end_time;
                }
                console.info(params);
                API.tripPlan.pageTripPlansByCompany(params)
                    .then(function(list){
                        $scope.planlist = list.items;
                        if($scope.planlist.length == 0){
                            
                        }
                        console.log( $scope.planlist );
                        var planlist = list.items;
                        $scope.total = list.total;
                        $scope.pages = list.pages;
                        planlist = planlist.map(function(plan){
                            return API.staff.getStaff({id:plan.accountId})
                                .then(function(staff){
                                    plan.staffName = staff.staff.name;
                                    return plan;
                                })
                                .catch(function(err){
                                    TLDAlert(err.msg || err);
                                })
                        })

                        Promise.all(planlist)
                            .then(function(ret){
                                $scope.planlist = ret;
                                ret.map(function(s){
                                    var desc = s.description;
                                    var dest =s.destination;
                                    var startP = s.startPlace;
                                    if(desc && desc.length>5){
                                        s.description= desc.substr(0,5) + '…';
                                    }
                                    if(dest && dest.length>5){
                                        s.destination= dest.substr(0,5) + '…';
                                    }
                                    if(startP && startP.length>5){
                                        s.startPlace= startP.substr(0,5) + '…';
                                    }
                                    if(s.hotel.length>0){
                                        var hotelName = s.hotel[0].hotelName;
                                        var city = s.hotel[0].city;
                                        if (hotelName && hotelName.length > 5) {
                                            s.hotel[0].hotelName = hotelName.substr(0, 5) + '…';
                                        }
                                        if(city.length >5){
                                            s.hotel[0].city = city.substr(0, 5) + '…';
                                        }
                                    }

                                    if(s.backTraffic.length>0){
                                        var startPlace = s.backTraffic[0].startPlace;
                                        var arrivalPlace = s.backTraffic[0].arrivalPlace;
                                        if (startPlace && startPlace.length > 5) {
                                            s.backTraffic[0].startPlace = startPlace.substr(0, 5) + '…';
                                        };
                                        if (arrivalPlace && arrivalPlace.length > 5) {
                                            s.backTraffic[0].arrivalPlace = arrivalPlace.substr(0, 5) + '…';
                                        };
                                    }
                                    if(s.outTraffic.length>0){
                                        var startPlace = s.outTraffic[0].startPlace;
                                        var arrivalPlace = s.outTraffic[0].arrivalPlace;
                                        if (startPlace && startPlace.length > 5) {
                                            s.outTraffic[0].startPlace = startPlace.substr(0, 5) + '…';
                                        };
                                        if (arrivalPlace && arrivalPlace.length > 5) {
                                            s.outTraffic[0].arrivalPlace = arrivalPlace.substr(0, 5) + '…';
                                        };
                                    }
                                    return s;
                                })
                            })
                            .catch(function(err){
                                TLDAlert(err.msg || err)
                            })
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err)
                    })
            })
        }
        initPlanlist();
        $scope.DoCtrlPagingAct = function( page, pageSize, total){
        	params = {page:page,perPage:20};
        	initPlanlist();
        }
     })
}