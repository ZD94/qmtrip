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
                window.location.href = "#/businessTravel/TrafficStep?purposename="+$scope.purposename+"&tra=1&liv=0";
            }
            if ($(".trafficimg").css('display')=='none' && $(".liveimg").css('display')=='inline') {
                window.location.href = "#/businessTravel/LiveStep?purposename="+$scope.purposename+"&tra=0&liv=1";
            }
            if ($(".trafficimg").css('display')=='inline' && $(".liveimg").css('display')=='inline') {
                window.location.href = "#/businessTravel/TrafficLive?purposename="+$scope.purposename+"&tra=1&liv=1";
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
        var tra = $routeParams.tra;
        var liv = $routeParams.liv;
        //出发城市获取
        $scope.startplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.startplacename})
                    .then(function(result) {
                        $scope.startplaceitems = result;
                        if ($scope.startplaceitems.length) {
                            $(".placelist1").show();
                        }
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
                        $scope.endplaceitems = result;
                        if ($scope.endplaceitems.length) {
                            $(".placelist2").show();
                        }
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
            window.location.href = "#/businessTravel/CreateResult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&spval="+startplace+"&epval="+endplace+"&"+parameter;
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
        var tra = $routeParams.tra;
        var liv = $routeParams.liv;
        //目的地城市获取
        $scope.endplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.endplacename})
                    .then(function(result) {
                        $scope.endplaceitems = result;
                        if ($scope.endplaceitems.length) {
                            $(".placelist1").show();
                        }
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
                        $scope.liveplaceitems = result;
                        if ($scope.liveplaceitems.length) {
                            $(".placelist2").show();
                        }
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
            window.location.href = "#/businessTravel/CreateResult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&epval="+endplace+"&lpval="+liveplace+"&"+parameter;
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
        var tra = $routeParams.tra;
        var liv = $routeParams.liv;
        //出发城市获取
        $scope.startplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.startplacename})
                    .then(function(result) {
                        $scope.startplaceitems = result;
                        if ($scope.startplaceitems.length) {
                            $(".placelist1").show();
                        }
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
                        $scope.endplaceitems = result;
                        if ($scope.endplaceitems.length) {
                            $(".placelist2").show();
                        }
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
                API.place.queryBusinessDistrict({keyword:$scope.liveplacename,code:$(".traffic2").attr("checkval")})
                    .then(function(result) {
                        $scope.liveplaceitems = result;
                        if ($scope.liveplaceitems.length) {
                            $(".placelist2").show();
                        }
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
            window.location.href = "#/businessTravel/CreateResult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&spval="+startplace+"&epval="+endplace+"&lpval="+liveplace+"&"+parameter;
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
    businessTravel.CreateResultController = function($scope, $routeParams, $filter) {
        loading(false);
        loading(true);
        $("title").html("我要出差");
        var tra = $routeParams.tra;
        var liv = $routeParams.liv;
        $scope.purposename = $routeParams.purposename;//出差目的
        $scope.tra = $routeParams.tra;//是否交通
        $scope.liv = $routeParams.liv;//是否住宿
        $scope.nowtime = new Date();
        //只选交通
        if (tra==1&&liv==0) {
            $scope.startplace = $routeParams.sp;//出发城市
            $scope.startplaceval = $routeParams.spval;//出发城市代码
            $scope.endplace = $routeParams.ep;//目的地城市
            $scope.endplaceval = $routeParams.epval;//目的地城市代码
            $scope.starttime = $routeParams.st;//出发日期
            $scope.starttimelate = $routeParams.stl;//出发最晚到达时间
            $scope.endtime = $routeParams.et;//返回日期
            $scope.endtimelate = $routeParams.etl;//返回最晚到达时间
            API.onload(function() {
                Q.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getTrafficBudget({
                        originPlace:$scope.startplaceval,
                        destinationPlace:$scope.endplaceval,
                        outboundDate:$scope.starttime,
                        inboundDate:$scope.endtime,
                        outLatestArriveTime:$scope.starttimelate,
                        inLatestArriveTime:$scope.endtimelate,
                        isRoundTrip:$scope.endtime
                    })
                ])
                    .spread(function(ret1,ret2) {
                        console.info (ret2);
                        $scope.companyId = ret1.companyId;
                        $scope.onlytraffic = ret2;
                        $(".creating").hide();
                        $(".createresult,.tianxun").show();
                        $scope.totalprice = ret2.price;
                        $scope.goTraffic = $scope.onlytraffic.goTraffic;
                        $scope.backTraffic = $scope.onlytraffic.backTraffic;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                        Myalert("温馨提示","生成预算失败，请重新生成");
                    });
            })
        }
        //只选住宿
        if (tra==0&&liv==1) {
            $scope.endplace = $routeParams.ep;//目的地城市
            $scope.endplaceval = $routeParams.epval;//目的地城市代码
            $scope.liveplace = $routeParams.lp;//住宿位置
            $scope.livetime = $routeParams.livet;//入住时间
            $scope.leavetime = $routeParams.leavet;//离店时间
            $scope.businessDistrict = $routeParams.lpval;   //商圈
            API.onload(function() {
                Q.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getHotelBudget({
                        cityId:$scope.endplaceval,
                        businessDistrict:$scope.businessDistrict,
                        checkInDate: $scope.livetime,
                        checkOutDate: $scope.leavetime
                    })
                ])
                    .spread(function(ret1,ret2) {
                        console.info (ret2);
                        $scope.companyId = ret1.companyId;
                        $scope.onlylive = ret2;
                        $(".creating").hide();
                        $(".createresult,.tianxun").show();
                        $scope.totalprice = ret2.price;
                        $scope.liveprice = $scope.onlylive.price;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                        Myalert("温馨提示","生成预算失败，请重新生成");
                    });
            })

        }
        //交通+住宿
        if (tra==1&&liv==1) {
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
            $scope.businessDistrict = $routeParams.lpval;   //商圈
            API.onload(function() {
                Q.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getTravelPolicyBudget({
                        originPlace:$scope.startplaceval,
                        destinationPlace:$scope.endplaceval,
                        outboundDate:$scope.starttime,
                        inboundDate:$scope.endtime,
                        outLatestArriveTime:$scope.starttimelate,
                        inLatestArriveTime:$scope.endtimelate,
                        businessDistrict:$scope.businessDistrict,
                        checkInDate:$scope.livetime,
                        checkOutDate:$scope.leavetime,
                        isRoundTrip:$scope.endtime
                    })
                ])
                    .spread(function(ret1,ret2) {
                        console.info (ret2);
                        $scope.companyId = ret1.companyId;
                        $scope.trafficlive = ret2;
                        $(".creating").hide();
                        $(".createresult,.tianxun").show();
                        $scope.totalprice = ret2.price;
                        $scope.trafficprice = $scope.trafficlive.traffic;
                        $scope.liveprice = $scope.trafficlive.hotel;
                        $scope.goTraffic = $scope.trafficlive.goTraffic;
                        $scope.backTraffic = $scope.trafficlive.backTraffic;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                        Myalert("温馨提示","生成预算失败，请重新生成");
                    });
            })
        }

        //生成记录
        $scope.createRecord = function () {
            API.onload(function(){
                var consumeDetails = [];
                var order = {
                    companyId:$scope.companyId,
                    type:1,
                    remark:$scope.purposename,
                    startPlace:$scope.startplace,
                    destination:$scope.endplace,
                    startAt:$scope.starttime,
                    startTime:$scope.livetime,
                    endTime:$scope.leavetime,
                    budget:$scope.totalprice,
                    isNeedTraffic:$scope.tra,
                    isNeedHotel:$scope.liv
                }
                if ($scope.endtime) {
                    order.backAt = $scope.endtime;
                }
                //住宿
                if(liv==1){
                    var consumeDetails_hotel = {
                        type:0,
                        city:$scope.endplace,
                        hotelName:$scope.liveplace,
                        startTime:$scope.livetime,
                        endTime:$scope.leavetime,
                        budget:$scope.liveprice,
                        invoiceType:2
                    }
                    consumeDetails.push(consumeDetails_hotel);
                }

                //去程
                if($scope.starttime){
                    var consumeDetails_outTraffic = {
                        type:-1,
                        startPlace:$scope.startplace,
                        arrivalPlace:$scope.endplace,
                        startTime:$scope.starttime,
                        budget:$scope.goTraffic,
                        invoiceType:1
                    }
                    if($scope.endtime){
                        consumeDetails_outTraffic.endTime = $scope.endtime;
                    }
                    if($scope.starttimelate){
                        consumeDetails_outTraffic.latestArriveTime = $scope.starttime+' '+$scope.starttimelate;
                    }
                    consumeDetails.push(consumeDetails_outTraffic);
                }

                //回程
                if($scope.endtime){
                    var consumeDetails_backTraffic = {
                        type:1,
                        startPlace:$scope.startplace,
                        arrivalPlace:$scope.endplace,
                        startTime:$scope.starttime,
                        endTime:$scope.endtime,
                        budget:$scope.backTraffic,
                        invoiceType:1
                    }
                    if($scope.endtimelate){
                        consumeDetails_backTraffic.latestArriveTime = $scope.endtime+' '+$scope.endtimelate;
                    }
                    consumeDetails.push(consumeDetails_backTraffic);
                }
                order.consumeDetails = consumeDetails;

                API.tripPlan.savePlanOrder(order)
                    .then(function(result){
                        $scope.createTime = result.createAt;
                        $(".bottom1").hide();
                        $(".bottom2").show();
                        $('.createtime').html("生成时间："+$filter('date')($scope.createTime,'yyyy-MM-dd'));
                        Myalert("温馨提示","生成出差记录成功");
                    })
                    .catch(function(err){
                        console.info (err);
                    });
            })
        }
        //返回上一步
        $scope.prevstep = function () {
            if (tra==1&&liv==0) {
                window.location.href = "#/businessTravel/TrafficStep?purposename="+$scope.purposename+"&tra="+tra+"&liv="+liv;
            }
            if (tra==0&&liv==1) {
                window.location.href = "#/businessTravel/LiveStep?purposename="+$scope.purposename+"&tra="+tra+"&liv="+liv;
            }
            if (tra==1&&liv==1) {
                window.location.href = "#/businessTravel/TrafficLive?purposename="+$scope.purposename+"&tra="+tra+"&liv="+liv;
            }
        }
        //取消
        $scope.cancel = function () {
            window.location.href = "#/businessTravel/Index";
        }
        //去预订
        $scope.bookTicket = function () {
            window.location.href = "http://www.tianxun.com/"
        }
        //上传票据
        $scope.upLoad = function () {
            window.location.href = "#/travelPlan/PlanList"
        }
    }


    return businessTravel;
})();

module.exports = businessTravel;