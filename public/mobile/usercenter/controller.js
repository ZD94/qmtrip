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
        $('title').html('个人中心');
        $scope.$root.pageTitle = '个人中心';

        $scope.initStaffUser = function(){
            API.onload(function(){
                API.staff.getCurrentStaff()
                    .then(function(ret){
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
                            API.tripPlan.statPlanOrderMoney({}),
                            API.travelPolicy.getTravelPolicy({id: travelLevel}),
                            API.tripPlan.pageTripPlanOrder({isHasBudget: false}),
                            API.tripPlan.pageTripPlanOrder({isUpload:false}),
                            API.tripPlan.pageTripPlanOrder({audit:"N"})
                        ])
                            .spread(function(planMoney,travelPolicy,plan_status_1,plan_status_2,plan_status_3){
                                console.info(planMoney);
                                $scope.total_budget = planMoney.planMoney;
                                $scope.actual_consume = planMoney.expenditure;
                                $scope.save_money = planMoney.savedMoney;

                                $scope.travelpolicy = travelPolicy;
                                $scope.tavel_id = travelPolicy.id;

                                $scope.total1 = plan_status_1.total;
                                $scope.total2 = plan_status_2.total;
                                $scope.total3 = plan_status_3.total;
                                $scope.$apply();

                                function judge(id){
                                    var num = $('#'+id).text();
                                    if(num == 0){
                                        $('#'+id).hide();
                                    }else if(num >0 && num<=9){
                                        $('#'+id).show();
                                    }else if (num > 9 && num <100){
                                        $('#'+id).css('font-size','1rem');
                                        $('#'+id).show();
                                    }else if (num > 99){
                                        $('#'+id).css({'font-size':'1rem','width':'2rem'});
                                        $('#'+id).html('99+');
                                        $('#'+id).show();
                                    }
                                }
                                judge('total1');
                                judge('total2');
                                judge('total3');
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

        $scope.go_business = function() {
            window.location.href = "#/businesstravel/index";
        }

        $scope.go_planlist = function() {//跳转到“出差记录列表页”。状态为“未完成”。
            window.location.href = "#/travelplan/planlist?status="+"DEFAULT";
        }

        $scope.go_budget = function() {
            window.location.href = "#/travelplan/planlist?status="+"WAIT";
        }

        $scope.go_invoice = function() {
            window.location.href = "#/travelplan/planlist?status="+"WAIT_UPLOAD";
        }

        $scope.go_unpass = function() {
            window.location.href = "#/travelplan/planlist?status="+"REJECT";
        }

        $scope.go_travelstandard = function () {
            window.location.href = "#/usercenter/travelpolicy?travelId=" + $scope.tavel_id;
        }
    }

    user.TravelpolicyController = function($scope) {
        $('title').html('差旅标准');
        $scope.$root.pageTitle = '差旅标准';
        loading(true);
        API.onload(function(){
            API.travelPolicy.getCurrentStaffTp()
                .then(function(travelPolicy){
                    $scope.travelpolicy = travelPolicy;
                    $scope.$apply();
                })
                .catch(function(err){
                    console.info(err || err.msg);
                })
                .done();
        })
    }

    return user;
})();
