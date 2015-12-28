/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var businessTravel=(function(){

    API.require("auth");
    API.require("place");
    API.require("travelPolicy");
    API.require("tripPlan");
    API.require("travelBudget");

    var  businessTravel = {};

    /*
        我要出差首页
     * @param $scope
     * @constructor
     */
    businessTravel.IndexController = function($scope) {
        loading(true);
        $("title").html("我要出差");
        Myselect();
        //step1 获取选择状态
        $scope.trafficimg = $(".trafficimg").css("display");
        $scope.liveimg = $(".liveimg").css("display");
        $scope.chooseTraffic = function () {
            $(".trafficimg").toggle();
            $scope.trafficimg = $(".trafficimg").css("display");
        }
        $scope.chooseLive = function () {
            $(".liveimg").toggle();
            $scope.liveimg = $(".liveimg").css("display");
        }
        $scope.NextStep = function () {
            if ($scope.purposename=="" || $scope.purposename==undefined) {
                Myalert("温馨提示","请填写出差目的");
                return false;
            }
            if ($(".trafficimg").css('display')=='inline' && $(".liveimg").css('display')=='none'){
                window.location.href = "#/businessTravel/TrafficStep?purposename="+$scope.purposename;
            }
            if ($(".trafficimg").css('display')=='none' && $(".liveimg").css('display')=='inline') {
                window.location.href = "#/businessTravel/LiveStep?purposename="+$scope.purposename;
            }
            if ($(".trafficimg").css('display')=='inline' && $(".liveimg").css('display')=='inline') {
                window.location.href = "#/businessTravel/TrafficLive?purposename="+$scope.purposename;
            }
        }
    }

    /*
     我要出差选择交通
     * @param $scope
     * @constructor
     */
    businessTravel.TrafficStepController = function($scope, $routeParams) {
        loading(true);
        $("title").html("我要出差");
        Myselect();
        var purposename = $routeParams.purposename;

        //出发城市获取
        $scope.startplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.startplacename})
                    .then(function(result) {
                        $(".placelist1").show();
                        $scope.startplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.chooseStartplace = function (name,id) {
            $(".traffic1").val(name);
            $(".traffic1").attr("checkval",id);
            $(".placelist1").hide();
        }

        //目的地城市获取
        $scope.endplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.endplacename})
                    .then(function(result) {
                        $(".placelist2").show();
                        $scope.endplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.chooseEndplace = function (name,id) {
            $(".traffic2").val(name);
            $(".traffic2").attr("checkval",id);
            $(".placelist2").hide();
        }
        //生成预算
        $scope.budget = function () {
            var startplace = $(".traffic1").attr("checkval"),//出发城市id
                endplace = $(".traffic2").attr("checkval"),//目的地城市id
                starttime = $scope.start_time,//出发时间
                starttimelate = $scope.start_timelate,//出发最晚到达时间
                endtime = $scope.end_time,//返回时间
                endtimelate = $scope.end_timelate,//返回最晚到达时间
                parameter = $("form").serialize();//表单所有数据传参
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            var timeReg = /^\d{2}:\d{2}$/;
            if (startplace == "") {
                Myalert("温馨提示","请选择出发城市");
                return false;
            }
            if (endplace == "") {
                Myalert("温馨提示","请选择目的地城市");
                return false;
            }
            if (!starttime || !dateReg.test(starttime)) {
                Myalert("温馨提示","出发日期不存在或格式不正确");
                return false;
            }
            if (!dateReg.test(endtime)&&endtime!=undefined) {
                Myalert("温馨提示","返程日期格式不正确");
                return false;
            }
            if (starttime>=endtime&&endtime!=undefined) {
                Myalert("温馨提示","返程日期不能小于出发日期");
                return false;
            }
            if (startplace == endplace) {
                Myalert("温馨提示","出发城市与目的地城市不能相同");
                return false;
            }
            if (!timeReg.test(endtimelate)&&endtimelate!=undefined) {
                Myalert("温馨提示","最晚到达时间格式时间格式不正确");
                return false;
            }
            if (!timeReg.test(starttimelate)&&starttimelate!=undefined) {
                Myalert("温馨提示","最晚到达时间格式时间格式不正确");
                return false;
            }
            window.location.href = "#/businessTravel/CreateResult?purposename="+purposename+"&spval="+startplace+"&epval="+endplace+"&"+parameter;
        }
        //返回上一步
        $scope.prevstep = function () {
            window.location.href = "#/businessTravel/Index";
        }
    }



    /*
     我要出差选择住宿
     * @param $scope
     * @constructor
     */
    businessTravel.LiveStepController = function($scope, $routeParams) {
        loading(true);
        $("title").html("我要出差");
        Myselect();
        var purposename = $routeParams.purposename;
        //目的地城市获取
        $scope.endplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.endplacename})
                    .then(function(result) {
                        $(".placelist1").show();
                        $scope.endplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.chooseEndplace = function (name,id) {
            $(".live1").val(name);
            $(".live1").attr("checkval",id);
            $(".placelist1").hide();
        }

        //住宿位置获取
        $scope.liveplace = function () {
            API.onload(function() {
                API.place.queryBusinessDistrict({keyword:$scope.liveplacename,code:$(".live1").attr("checkval")})
                    .then(function(result) {
                        $(".placelist2").show();
                        $scope.liveplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.chooseLiveplace = function (name,id) {
            $(".live2").val(name);
            $(".live2").attr("checkval",id);
            $(".placelist2").hide();
        }

        //生成预算
        $scope.budget = function () {
            var endplace = $(".live1").attr("checkval"),//目的地城市id
                liveplace = $(".live2").attr("checkval"),//住宿位置id
                livetime = $scope.live_time,//入住时间
                leavetime = $scope.leave_time,//离店时间
                parameter = $("form").serialize();//表单所有数据传参
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            if (endplace == "") {
                Myalert("温馨提示","请选择目的地城市");
                return false;
            }
            if (liveplace == "") {
                Myalert("温馨提示","请选择住宿位置");
                return false;
            }
            if (!livetime || !dateReg.test(livetime)) {
                Myalert("温馨提示","入住日期不存在或格式不正确");
                return false;
            }
            if (!leavetime || !dateReg.test(leavetime)) {
                Myalert("温馨提示","离店日期不存在或格式不正确");
                return false;
            }
            if (livetime>=leavetime&&leavetime!=undefined) {
                Myalert("温馨提示","离店日期不能小于入住日期");
                return false;
            }
            window.location.href = "#/businessTravel/CreateResult?purposename="+purposename+"&epval="+endplace+"&lpval="+liveplace+"&"+parameter;
        }
        //返回上一步
        $scope.prevstep = function () {
            window.location.href = "#/businessTravel/Index";
        }
    }



    /*
     我要出差选择交通和住宿
     * @param $scope
     * @constructor
     */
    businessTravel.TrafficLiveController = function($scope, $routeParams) {
        loading(true);
        $("title").html("我要出差");
        Myselect();
        var purposename = $routeParams.purposename;

        //出发城市获取
        $scope.startplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.startplacename})
                    .then(function(result) {
                        $(".placelist1").show();
                        $scope.startplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.chooseStartplace = function (name,id) {
            $scope.startplacename = name;
            $(".traffic1").attr("checkval",id);
            $(".placelist1").hide();
        }

        //目的地城市获取
        $scope.endplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.endplacename})
                    .then(function(result) {
                        $(".placelist2").show();
                        $scope.endplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.chooseEndplace = function (name,id) {
            $scope.endplacename = name;
            $(".traffic2").attr("checkval",id);
            $(".placelist2").hide();
        }


        //住宿位置获取
        $scope.liveplace = function () {
            API.onload(function() {
                API.place.queryBusinessDistrict({keyword:$scope.liveplacename,code:$(".live1").attr("checkval")})
                    .then(function(result) {
                        $(".placelist2").show();
                        $scope.liveplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.chooseLiveplace = function (name,id) {
            $(".live2").val(name);
            $(".live2").attr("checkval",id);
            $(".placelist2").hide();
        }

        //下一步
        $scope.nextStep = function () {
            var startplace = $(".traffic1").attr("checkval"),//出发城市id
                endplace = $(".traffic2").attr("checkval"),//目的地城市id
                starttime = $scope.start_time,//出发时间
                starttimelate = $scope.start_timelate,//出发最晚到达时间
                endtime = $scope.end_time,//返回时间
                endtimelate = $scope.end_timelate,//返回最晚到达时间
                parameter = $("form").serialize();//表单所有数据传参
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            var timeReg = /^\d{2}:\d{2}$/;
            if (startplace == "") {
                Myalert("温馨提示","请选择出发城市");
                return false;
            }
            if (endplace == "") {
                Myalert("温馨提示","请选择目的地城市");
                return false;
            }
            if (!starttime || !dateReg.test(starttime)) {
                Myalert("温馨提示","出发日期不存在或格式不正确");
                return false;
            }
            if (!dateReg.test(endtime)&&endtime!=undefined) {
                Myalert("温馨提示","返程日期格式不正确");
                return false;
            }
            if (starttime>=endtime&&endtime!=undefined) {
                Myalert("温馨提示","返程日期不能小于出发日期");
                return false;
            }
            if (startplace == endplace) {
                Myalert("温馨提示","出发城市与目的地城市不能相同");
                return false;
            }
            if (!timeReg.test(endtimelate)&&endtimelate!=undefined) {
                Myalert("温馨提示","最晚到达时间格式时间格式不正确");
                return false;
            }
            if (!timeReg.test(starttimelate)&&starttimelate!=undefined) {
                Myalert("温馨提示","最晚到达时间格式时间格式不正确");
                return false;
            }
            $(".traffic_step1").hide();
            $(".live_step1").show();
        }

        //生成预算
        $scope.budget = function () {
            var startplace = $(".traffic1").attr("checkval"),//出发城市id
                endplace = $(".traffic2").attr("checkval"),//目的地城市id
                liveplace = $(".live2").attr("checkval"),//住宿位置id
                livetime = $scope.live_time,//入住时间
                leavetime = $scope.leave_time,//离店时间
                parameter = $("form").serialize();//表单所有数据传参
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            if (liveplace == "") {
                Myalert("温馨提示","请选择住宿位置");
                return false;
            }
            if (!livetime || !dateReg.test(livetime)) {
                Myalert("温馨提示","入住日期不存在或格式不正确");
                return false;
            }
            if (!leavetime || !dateReg.test(leavetime)) {
                Myalert("温馨提示","离店日期不存在或格式不正确");
                return false;
            }
            if (livetime>=leavetime&&leavetime!=undefined) {
                Myalert("温馨提示","离店日期不能小于入住日期");
                return false;
            }
            console.info (parameter);
            window.location.href = "#/businessTravel/CreateResult?purposename="+purposename+"&spval="+startplace+"&epval="+endplace+"&lpval="+liveplace+"&"+parameter;
        }

        //返回上一步
        $scope.prevstep = function () {
            window.location.href = "#/businessTravel/Index";
        }

    }


    /*
     我要出差获取预算结果
     * @param $scope
     * @constructor
     */
    businessTravel.CreateResultController = function($scope, $routeParams) {
        loading(true);
        $("title").html("我要出差");
        $scope.purposename = $routeParams.purposename;//出差目的
        $scope.startplace = $routeParams.sp;//出发城市
        $scope.startplaceval = $routeParams.spval;//出发城市代码
        $scope.endplace = $routeParams.ep;//目的地城市
        $scope.endplaceval = $routeParams.epval;//目的地城市代码
        $scope.starttime = $routeParams.st;//出发日期
        $scope.starttimelate = $routeParams.stl;//出发最晚到达时间
        $scope.endtime = $routeParams.et;//返回日期
        $scope.endtimelate = $routeParams.etl;//返回最晚到达时间
        $scope.liveplace = $routeParams.lp;//住宿位置
        $scope.livetime = $routeParams.livet;//入住时间
        $scope.leavetime = $routeParams.leavet;//离店时间
        API.onload(function() {
            Q.all([
                API.staff.getCurrentStaff(),
                API.travelBudget.getTravelPolicyBudget({
                    originPlace:$scope.startplaceval,
                    destinationPlace:$scope.endplaceval,
                    outboundDate:$scope.starttime,
                    inboundDate:$scope.endtime
                })
            ])
                .spread(function(ret1,ret2) {
                    $scope.companyId = ret1.companyId;
                    $scope.price = ret2;
                    $(".creating").hide();
                    $(".createresult,.tianxun").show();
                    $scope.totalprice = ret2.price;
                    $scope.$apply();
                })
                .catch(function(err){
                    console.info (err);
                    $(".messagebox_close").click(function(){
                        location.reload();
                    });
                });
        })

        //返回上一步
        $scope.prevstep = function () {
            if ($scope.startplace && !$scope.liveplace) {
                window.location.href = "#/businessTravel/TrafficStep?purposename="+$scope.purposename;
            }
            if (!$scope.startplace && $scope.liveplace) {
                window.location.href = "#/businessTravel/LiveStep?purposename="+$scope.purposename;
            }
            if ($scope.startplace && $scope.liveplace) {
                window.location.href = "#/businessTravel/TrafficLive?purposename="+$scope.purposename;
            }
        }

        //取消
        $scope.cancel = function () {
            window.location.href = "#/businessTravel/Index";
        }

        //生成记录
        $scope.createRecord = function () {
            API.onload(function(){
                API.tripPlan.savePlanOrder({
                    companyId:$scope.companyId,
                    type:1,
                    startPlace:$scope.startplace,
                    destination:$scope.endplace,
                    startAt:$scope.starttime,
                    backAt:$scope.endtime,
                    hotelName:$scope.liveplace,
                    startTime:$scope.livetime,
                    endTime:$scope.leavetime,
                    budget:$scope.totalprice
                })
                    .then(function(result){
                        console.info(result);
                        $(".bottom1").hide();
                        $(".bottom2").show();
                        Myalert("温馨提示","生成出差记录成功");
                    })
                    .catch(function(err){
                        console.info (err);
                    });
            })
        }
    }


    return businessTravel;
})();

module.exports = businessTravel;