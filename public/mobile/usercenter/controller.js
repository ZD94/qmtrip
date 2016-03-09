/**
 * Created by qp on 2016/3/3.
 */
'use strict';
module.exports = (function() {
    API.require("company");
    API.require("staff");
    API.require("tripPlan");
    API.require("travelPolicy");
    var user = {};

    user.IndexController = function($scope) {
        console.info(123);
        $scope.initStaffUser = function(){
            API.onload(function(){
                API.staff.getCurrentStaff()
                    .then(function(ret){
                        console.info(ret);
                        var company_id = ret.companyId;
                        var travelLevel =ret.travelLevel;
                        var str = ret.name;
                        $scope.staff = ret;
                        $scope.name = str;
                        $scope.firstname=str.substring(str.length-2,str.length);
                        if(ret.roleId == 0){
                            $scope.power = "创建者";
                        }else if (ret.roleId == 2){
                            $scope.power = "管理员";
                        }else{
                            $scope.power = "普通员工";
                        }
                        Q.all([
                            API.tripPlan.countTripPlanNum({accountId:ret.id}),
                            API.travelPolicy.getTravelPolicy({id: travelLevel})
                        ])
                            .spread(function(tripPlanOrders,travelPolicy){
                                $scope.businesstimes = tripPlanOrders;
                                $scope.travelpolicy = travelPolicy;
                                //dataloading(true);
                                $scope.$apply();
                            })
                            .catch(function(err){
                                TLDAlert(err.msg || err)
                            })
                        $scope.$apply();
                        loading(true);
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err)
                    })
            })
        }
        $scope.initStaffUser();
    }
    return user;
})();
