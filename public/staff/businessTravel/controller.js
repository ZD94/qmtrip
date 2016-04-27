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

    var INVOICE_TYPE = {
        TRAIN: 'TRAIN',
        PLANE: 'PLANE',
        HOTEL: 'HOTEL'
    }

    var  businessTravel = {};

    /*
        我要出差首页
     * @param $scope
     * @constructor
     */
    businessTravel.IndexController = function($scope) {
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(3).find("li").addClass("on");
        $("title").html("我要出差");
        Myselect();

        $scope.searchPurposeName = function () {
            API.onload(function() {
                API.tripPlan.getProjectsList({project_name: $scope.purposename})
                    .then(function(result) {
                        $scope.PurposeNameitems = result;
                        if ($scope.PurposeNameitems) {
                            $(".PurposeNamelist").show();
                        }
                        console.info (result);
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.choosepPurposeName = function (project_name) {
            $scope.purposename = project_name;
            $(".PurposeNamelist").hide();
        }
        $(".purposename").blur(function(){
            setTimeout('$(".PurposeNamelist").hide()', 500);
        })




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
    businessTravel.TrafficStepController = function($scope, $stateParams) {
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(3).find("li").addClass("on");
        $("title").html("我要出差");
        Myselect();
        var purposename = $stateParams.purposename;
        var tra = $stateParams.tra;
        var liv = $stateParams.liv;
        //出发城市获取
        $scope.startplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.startplacename})
                    .then(function(result) {
                        $scope.startplaceitems = result;
                        if ($scope.startplaceitems.length) {
                            $(".placelist1").show();
                        }
                    })
                    .catch(function(err){
                        $(".placelist1").hide();
                        console.log(err);
                    });
            })
        }
        $scope.chooseStartplace = function (name,id) {
            $(".traffic1").val(name);
            $(".traffic1").attr("checkval",id);
            $(".placelist1").hide();
        }
        $(".traffic1").blur(function(){
            setTimeout('$(".placelist1").hide()', 500);
        })

        //目的地城市获取
        $scope.endplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.endplacename})
                    .then(function(result) {
                        $scope.endplaceitems = result;
                        if ($scope.endplaceitems.length) {
                            $(".placelist2").show();
                        }
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
        $(".traffic2").blur(function(){
            setTimeout('$(".placelist2").hide()', 500);
        })
        //生成预算
        $scope.budget = function () {
            var startplaceval = $(".traffic1").attr("checkval"),//出发城市id
                endplaceval = $(".traffic2").attr("checkval"),//目的地城市id
                startplace = $(".traffic1").val(),
                endplace = $(".traffic2").val(),
                starttime = $scope.start_time,//出发时间
                starttimelate = $scope.start_timelate,//出发最晚到达时间
                endtime = $scope.end_time,//返回时间
                endtimelate = $scope.end_timelate,//返回最晚到达时间
                parameter = $("form").serialize();//表单所有数据传参
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            var timeReg = /^\d{1,2}:\d{2}$/;
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
            if (starttime>endtime&&endtime!=undefined) {
                Myalert("温馨提示","返程日期不能小于出发日期");
                return false;
            }
            if (startplace == endplace) {
                Myalert("温馨提示","出发城市与目的地城市不能相同");
                return false;
            }
            if (!timeReg.test(endtimelate)&&endtimelate!=undefined&&endtimelate!="") {
                Myalert("温馨提示","最晚到达时间格式不正确");
                return false;
            }
            if (!timeReg.test(starttimelate)&&starttimelate!=undefined&&starttimelate!="") {
                Myalert("温馨提示","最晚到达时间格式不正确");
                return false;
            }


            API.onload(function() {
                var consumeDetails = [];
                var order = {
                    companyId:$scope.companyId,
                    type:1,
                    description:purposename,
                    startPlace:startplace,
                    startPlaceCode:startplaceval,
                    destination:endplace,
                    destinationCode:endplaceval,
                    startAt:starttime,
                    isNeedTraffic:tra,
                    isNeedHotel:liv
                }
                if (endtime) {
                    order.backAt = endtime;
                }

                //去程
                if(starttime){
                    var consumeDetails_outTraffic = {
                        type:-1,
                        startPlace:startplace,
                        startPlaceCode:startplaceval,
                        arrivalPlace:endplace,
                        arrivalPlaceCode:endplaceval,
                        startTime:starttime,
                        invoiceType: INVOICE_TYPE.PLANE
                    }
                    if(endtime){
                        consumeDetails_outTraffic.endTime = endtime;
                    }
                    if(starttimelate){
                        consumeDetails_outTraffic.latestArriveTime = starttime+' '+starttimelate;
                    }
                    consumeDetails.push(consumeDetails_outTraffic);
                }

                //回程
                if(endtime){
                    var consumeDetails_backTraffic = {
                        type:1,
                        startPlace:endplace,
                        startPlaceCode:endplaceval,
                        arrivalPlace:startplace,
                        arrivalPlaceCode:startplaceval,
                        startTime:endtime,
                        invoiceType: INVOICE_TYPE.PLANE
                    }
                    if(endtimelate){
                        consumeDetails_backTraffic.latestArriveTime = endtime+' '+endtimelate;
                    }
                    consumeDetails.push(consumeDetails_backTraffic);
                }
                order.consumeDetails = consumeDetails;
                API.tripPlan.checkBudgetExist(order)
                    .then(function(result) {
                        console.info (result);
                        if (result == false) {
                            window.location.href = "#/businessTravel/CreateResult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&spval="+startplaceval+"&epval="+endplaceval+"&"+parameter;
                        }
                        if (result != false) {
                            window.location.href = "#/travelPlan/PlanDetail?planId="+result;
                        }
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    });
            })


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
    businessTravel.LiveStepController = function($scope, $stateParams) {
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(3).find("li").addClass("on");
        $("title").html("我要出差");
        Myselect();
        var purposename = $stateParams.purposename;
        var tra = $stateParams.tra;
        var liv = $stateParams.liv;
        //目的地城市获取
        $scope.endplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.endplacename})
                    .then(function(result) {
                        $scope.endplaceitems = result;
                        if ($scope.endplaceitems.length) {
                            $(".placelist1").show();
                        }
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    });
            })
        }
        $scope.chooseEndplace = function (name,id) {
            $(".live1").val(name);
            $(".live1").attr("checkval",id);
            $(".placelist1").hide();
        }
        $(".live1").blur(function(){
            setTimeout('$(".placelist1").hide()', 500);
        })

        //住宿位置获取
        $scope.liveplace = function () {
            API.onload(function() {
                API.place.queryBusinessDistrict({keyword:$scope.liveplacename,code:$(".live1").attr("checkval")})
                    .then(function(result) {
                        $scope.liveplaceitems = result;
                        if ($scope.liveplaceitems.length) {
                            $(".placelist2").show();
                        }
                        if (!$scope.liveplaceitems.length) {
                            $(".placelist2").hide();
                        }
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    });
            })
        }
        $scope.chooseLiveplace = function (name,id) {
            $(".live2").val(name);
            $(".live2").attr("checkval",id);
            $(".placelist2").hide();
        }
        $(".live2").blur(function(){
            setTimeout('$(".placelist2").hide()', 500);
        })

        //生成预算
        $scope.budget = function () {
            var endplacename = $(".live1").val(),
                liveplacename = $(".live2").val(),
                endplace = $(".live1").attr("checkval"),//目的地城市id
                liveplace = $(".live2").attr("checkval"),//住宿位置id
                livetime = $scope.live_time,//入住时间
                leavetime = $scope.leave_time,//离店时间
                parameter = $("form").serialize();//表单所有数据传参
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            if (endplace == "") {
                Myalert("温馨提示", "请选择目的地城市");
                return false;
            }
            if (!livetime || !dateReg.test(livetime)) {
                Myalert("温馨提示", "入住日期不存在或格式不正确");
                return false;
            }
            if (!leavetime || !dateReg.test(leavetime)) {
                Myalert("温馨提示", "离店日期不存在或格式不正确");
                return false;
            }
            if (livetime > leavetime && leavetime != undefined) {
                Myalert("温馨提示", "离店日期不能小于入住日期");
                return false;
            }

            API.onload(function(){
                var consumeDetails = [];
                var order = {
                    companyId:$scope.companyId,
                    type:1,
                    description:purposename,
                    destination:endplacename,
                    destinationCode:endplace,
                    isNeedTraffic:tra,
                    isNeedHotel:liv
                }
                if (liv==1 && tra==0) {
                    order.startAt = livetime;
                    order.backAt = leavetime;
                }
                //住宿
                if(liv==1){
                    var consumeDetails_hotel = {
                        type:0,
                        city:endplacename,
                        cityCode:endplace,
                        hotelName:liveplacename,
                        startTime:livetime,
                        endTime:leavetime,
                        invoiceType: INVOICE_TYPE.PLANE
                    }
                    consumeDetails.push(consumeDetails_hotel);
                }
                order.consumeDetails = consumeDetails;
                API.tripPlan.checkBudgetExist(order)
                    .then(function(result) {
                        if (result == false) {
                            window.location.href = "#/businessTravel/CreateResult?purposename=" + purposename + "&tra=" + tra + "&liv=" + liv + "&epval=" + endplace + "&lpval=" + liveplace + "&" + parameter;
                        }
                        if (result != false) {
                            window.location.href = "#/travelPlan/PlanDetail?planId="+result;
                        }
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    });
            })



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
    businessTravel.TrafficLiveController = function($scope, $stateParams) {
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(3).find("li").addClass("on");
        $("title").html("我要出差");
        Myselect();
        var purposename = $stateParams.purposename;
        var tra = $stateParams.tra;
        var liv = $stateParams.liv;
        //出发城市获取
        $scope.startplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.startplacename})
                    .then(function(result) {
                        $scope.startplaceitems = result;
                        if ($scope.startplaceitems.length) {
                            $(".placelist1").show();
                        }
                    })
                    .catch(function(err){
                        console.info (err);
                    });
            })
        }
        $scope.chooseStartplace = function (name,id) {
            $scope.startplacename = name;
            $(".traffic1").attr("checkval",id);
            $(".placelist1").hide();
        }
        $(".traffic1").blur(function(){
            setTimeout('$(".placelist1").hide()', 500);
        })

        //目的地城市获取
        $scope.endplace = function () {
            API.onload(function() {
                API.place.queryPlace({keyword:$scope.endplacename})
                    .then(function(result) {
                        $scope.endplaceitems = result;
                        if ($scope.endplaceitems.length) {
                            $(".placelist2").show();
                        }
                    })
                    .catch(function(err){
                        console.info (err);
                    });
            })
        }
        $scope.chooseEndplace = function (name,id) {
            $scope.endplacename = name;
            $(".traffic2").attr("checkval",id);
            $(".placelist2").hide();
        }
        $(".traffic2").blur(function(){
            setTimeout('$(".placelist2").hide()', 500);
        })


        //住宿位置获取
        $scope.liveplace = function () {
            API.onload(function() {
                API.place.queryBusinessDistrict({keyword:$scope.liveplacename,code:$(".traffic2").attr("checkval")})
                    .then(function(result) {
                        $scope.liveplaceitems = result;
                        if ($scope.liveplaceitems.length) {
                            $(".placelist2").show();
                        }
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    });
            })
        }
        $scope.chooseLiveplace = function (name,id) {
            $(".live2").val(name);
            $(".live2").attr("checkval",id);
            $(".placelist2").hide();
        }
        $(".live2").blur(function(){
            setTimeout('$(".placelist2").hide()', 500);
        })

        //下一步
        $scope.nextStep = function () {
            var startplaceval = $(".traffic1").attr("checkval"),//出发城市id
                endplaceval = $(".traffic2").attr("checkval"),//目的地城市id
                startplace = $(".traffic1").val(),//出发城市id
                endplace = $(".traffic2").val(),//目的地城市id
                starttime = $scope.start_time,//出发时间
                starttimelate = $scope.start_timelate,//出发最晚到达时间
                endtime = $scope.end_time,//返回时间
                endtimelate = $scope.end_timelate,//返回最晚到达时间
                parameter = $("form").serialize();//表单所有数据传参
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            var timeReg = /^\d{2}:\d{2}$/;
            $scope.live_time = starttime;
            $scope.leave_time = endtime;
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
            if (starttime>endtime&&endtime!=undefined) {
                Myalert("温馨提示","返程日期不能小于出发日期");
                return false;
            }
            if (startplace == endplace) {
                Myalert("温馨提示","出发城市与目的地城市不能相同");
                return false;
            }
            if (!timeReg.test(endtimelate)&&endtimelate!=undefined&&endtimelate!="") {
                Myalert("温馨提示","最晚到达时间格式不正确");
                return false;
            }
            if (!timeReg.test(starttimelate)&&starttimelate!=undefined&&starttimelate!="") {
                Myalert("温馨提示","最晚到达时间格式不正确");
                return false;
            }
            $(".traffic_step1").hide();
            $(".live_step1").show();
        }

        //生成预算
        $scope.budget = function () {
            var startplaceval = $(".traffic1").attr("checkval"),//出发城市id
                endplaceval = $(".traffic2").attr("checkval"),//目的地城市id
                startplace = $(".traffic1").val(),//出发城市id
                endplace = $(".traffic2").val(),//目的地城市id
                starttime = $scope.start_time,//出发时间
                starttimelate = $scope.start_timelate,//出发最晚到达时间
                endtime = $scope.end_time,//返回时间
                endtimelate = $scope.end_timelate,//返回最晚到达时间
                startplaceval = $(".traffic1").attr("checkval"),//A出发城市id
                endplaceval = $(".traffic2").attr("checkval"),//目的地城市id
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
            if (livetime>leavetime&&leavetime!=undefined) {
                Myalert("温馨提示","离店日期不能小于入住日期");
                return false;
            }


            API.onload(function() {
                var consumeDetails = [];
                var order = {
                    companyId:$scope.companyId,
                    type:1,
                    description:purposename,
                    startPlace:startplace,
                    startPlaceCode:startplaceval,
                    destination:endplace,
                    destinationCode:endplaceval,
                    startAt:starttime,
                    startTime:livetime,
                    endTime:leavetime,
                    isNeedTraffic:tra,
                    isNeedHotel:liv,
                    remark:startplace+endplace+starttime+liveplace+livetime
                }
                if (endtime) {
                    order.backAt = endtime;
                }
                if (liv==1 && tra==0) {
                    order.startAt = livetime;
                }
                //住宿
                if(liv==1){
                    var consumeDetails_hotel = {
                        type:0,
                        city:endplace,
                        cityCode:endplaceval,
                        hotelName:liveplace,
                        startTime:livetime,
                        endTime:leavetime,
                        invoiceType: INVOICE_TYPE.HOTEL
                    }
                    consumeDetails.push(consumeDetails_hotel);
                }

                //去程
                if(starttime){
                    var consumeDetails_outTraffic = {
                        type:-1,
                        startPlace:startplace,
                        startPlaceCode:startplaceval,
                        arrivalPlace:endplace,
                        arrivalPlaceCode:endplaceval,
                        startTime:starttime,
                        invoiceType: INVOICE_TYPE.PLANE
                    }
                    if(endtime){
                        consumeDetails_outTraffic.endTime = endtime;
                    }
                    if(starttimelate){
                        consumeDetails_outTraffic.latestArriveTime = starttime+' '+starttimelate;
                    }
                    consumeDetails.push(consumeDetails_outTraffic);
                }

                //回程
                if(endtime){
                    var consumeDetails_backTraffic = {
                        type:1,
                        startPlace:endplace,
                        startPlaceCode:endplaceval,
                        arrivalPlace:startplace,
                        arrivalPlaceCode:startplaceval,
                        startTime:endtime,
                        invoiceType: INVOICE_TYPE.PLANE
                    }
                    if(endtimelate){
                        consumeDetails_backTraffic.latestArriveTime = endtime+' '+endtimelate;
                    }
                    consumeDetails.push(consumeDetails_backTraffic);
                }
                order.consumeDetails = consumeDetails;
                API.tripPlan.checkBudgetExist(order)
                    .then(function(result) {
                        if (result == false) {
                            window.location.href = "#/businessTravel/CreateResult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&spval="+startplaceval+"&epval="+endplaceval+"&lpval="+liveplace+"&"+parameter;
                        }
                        if (result != false) {
                            window.location.href = "#/travelPlan/PlanDetail?planId="+result;
                        }
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                    });
            })


        }

        //返回上一步
        $scope.prevstep = function () {
            window.location.href = "#/businessTravel/Index";
        }
        $scope.prevstep2 = function () {
            $(".live_step1").hide();
            $(".traffic_step1").show();
        }

    }


    /*
     我要出差获取预算结果
     * @param $scope
     * @constructor
     */
    businessTravel.CreateResultController = function($scope, $stateParams, $filter) {
        var spval = $stateParams.spval,
            epval = $stateParams.epval,
            st = $stateParams.st,
            et = $stateParams.et;
        $(".staff_menu_t ul li").removeClass("on");
        $(".staff_menu_t ul a").eq(3).find("li").addClass("on");
        $("title").html("我要出差");
        var tra = $stateParams.tra;
        var liv = $stateParams.liv;
        $scope.purposename = $stateParams.purposename;//出差目的
        $scope.tra = $stateParams.tra;//是否交通
        $scope.liv = $stateParams.liv;//是否住宿
        $scope.nowtime = new Date();
        //只选交通
        if (tra==1&&liv==0) {
            $scope.startplace = $stateParams.sp;//出发城市
            //$scope.startplaceval = $stateParams.spval;//出发城市代码
            if ($stateParams.spval=="") {
                $scope.startplaceval = $stateParams.sp;
            }
            else if ($stateParams.spval!="") {
                $scope.startplaceval = $stateParams.spval;
            }
            $scope.endplace = $stateParams.ep;//目的地城市
            //$scope.endplaceval = $stateParams.epval;//目的地城市代码
            if ($stateParams.epval=="") {
                $scope.endplaceval = $stateParams.ep;
            }
            else if ($stateParams.epval!="") {
                $scope.endplaceval = $stateParams.epval;
            }
            $scope.starttime = $stateParams.st;//出发日期
            $scope.starttimelate = $stateParams.stl;//出发最晚到达时间
            $scope.endtime = $stateParams.et;//返回日期
            $scope.endtimelate = $stateParams.etl;//返回最晚到达时间
            API.onload(function() {
                Promise.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getTrafficBudget({
                        originPlace:$scope.startplaceval,
                        destinationPlace:$scope.endplaceval,
                        outboundDate:$scope.starttime,
                        inboundDate:$scope.endtime,
                        outLatestArriveTime:$scope.starttimelate,
                        inLatestArriveTime:$scope.endtimelate,
                        isRoundTrip:$scope.endtime
                    }),
                    API.travelBudget.getBookUrl({
                        spval : spval,
                        epval : epval,
                        st : st,
                        et : et
                    })
                ])
                    .spread(function(ret1,ret2, url) {
                        if(ret2.goTraffic.type == "train"){
                            url = "https://kyfw.12306.cn/otn/leftTicket/init";
                        }
                        $scope.bookurl = url;
                        $scope.companyId = ret1.companyId;
                        $scope.onlytraffic = ret2;
                        $(".creating").hide();
                        $(".createresult,.tianxun").show();
                        $scope.totalprice = ret2.price;
                        $scope.goTraffic = ret2.goTraffic.price;
                        $scope.backTraffic = ret2.backTraffic.price;
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                        $(".creating").hide();
                        $(".budgetFail").show();
                    });
            })
        }
        //只选住宿
        if (tra==0&&liv==1) {
            $scope.endplace = $stateParams.ep;//目的地城市
            $scope.endplaceval = $stateParams.epval;//目的地城市代码
            $scope.liveplace = $stateParams.lp;//住宿位置
            $scope.livetime = $stateParams.livet;//入住时间
            $scope.leavetime = $stateParams.leavet;//离店时间
            $scope.businessDistrict = $stateParams.lpval;   //商圈
            API.onload(function() {
                Promise.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getHotelBudget({
                        cityId:$scope.endplaceval,
                        businessDistrict:$scope.businessDistrict,
                        checkInDate: $scope.livetime,
                        checkOutDate: $scope.leavetime
                    })
                ])
                    .spread(function(ret1,ret2) {
                        $scope.bookurl = ret2.bookListUrl;
                        $scope.companyId = ret1.companyId;
                        $scope.onlylive = ret2;
                        $(".creating").hide();
                        $(".createresult,.tianxun").show();
                        $scope.totalprice = ret2.price;
                        $scope.liveprice = $scope.onlylive.price;
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                        $(".creating").hide();
                        $(".budgetFail").show();
                    });
            })

        }
        //交通+住宿
        if (tra==1&&liv==1) {
            $scope.startplace = $stateParams.sp;//出发城市
            //$scope.startplaceval = $stateParams.spval;//出发城市代码
            if ($stateParams.spval=="") {
                $scope.startplaceval = $stateParams.sp;
            }
            else if ($stateParams.spval!="") {
                $scope.startplaceval = $stateParams.spval;
            }
            $scope.endplace = $stateParams.ep;//目的地城市
            //$scope.endplaceval = $stateParams.epval;//目的地城市代码
            if ($stateParams.epval=="") {
                $scope.endplaceval = $stateParams.ep;
            }
            else if ($stateParams.epval!="") {
                $scope.endplaceval = $stateParams.epval;
            }
            $scope.starttime = $stateParams.st;//出发日期
            $scope.starttimelate = $stateParams.stl;//出发最晚到达时间
            $scope.endtime = $stateParams.et;//返回日期
            $scope.endtimelate = $stateParams.etl;//返回最晚到达时间
            $scope.liveplace = $stateParams.lp;//住宿位置
            $scope.livetime = $stateParams.livet;//入住时间
            $scope.leavetime = $stateParams.leavet;//离店时间
            $scope.businessDistrict = $stateParams.lpval;   //商圈
            API.onload(function() {
                Promise.all([
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
                    }),
                    API.travelBudget.getBookUrl({
                        spval : spval,
                        epval : epval,
                        st : st,
                        et : et
                    })
                ])
                    .spread(function(ret1,ret2,url) {
                        if(ret2.goTraffic.type == "train"){
                            url = "https://kyfw.12306.cn/otn/leftTicket/init";
                        }
                        $scope.bookurl = url;
                        $scope.companyId = ret1.companyId;
                        $scope.trafficlive = ret2;
                        $(".creating").hide();
                        $(".createresult,.tianxun").show();
                        $scope.totalprice = ret2.price;
                        $scope.trafficprice = $scope.trafficlive.traffic;
                        $scope.liveprice = $scope.trafficlive.hotel;
                        $scope.goTraffic = ret2.goTraffic.price;
                        $scope.backTraffic = ret2.backTraffic.price;
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
                        $(".creating").hide();
                        $(".budgetFail").show();
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
                    description:$scope.purposename,
                    startPlace:$scope.startplace,
                    startPlaceCode:$scope.startplaceval,
                    destination:$scope.endplace,
                    destinationCode:$scope.endplaceval,
                    startAt:$scope.starttime,
                    budget:Number($scope.totalprice),
                    isNeedTraffic:$scope.tra,
                    isNeedHotel:$scope.liv,
                    remark:$scope.startplace+$scope.endplace+$scope.starttime+$scope.liveplace+$scope.livetime
                }
                if ($scope.endtime) {
                    order.backAt = $scope.endtime;
                }
                if (liv==1 && tra==0) {
                    order.startAt = $scope.livetime;
                    order.backAt = $scope.leavetime;
                }
                //住宿
                if(liv==1){
                    var consumeDetails_hotel = {
                        type:0,
                        city:$scope.endplace,
                        cityCode:$scope.endplaceval,
                        hotelName:$scope.liveplace,
                        startTime:$scope.livetime,
                        endTime:$scope.leavetime,
                        budget:Number($scope.liveprice),
                        invoiceType: INVOICE_TYPE.HOTEL
                    }
                    consumeDetails.push(consumeDetails_hotel);
                }

                //去程
                if($scope.starttime){
                    var consumeDetails_outTraffic = {
                        type:-1,
                        startPlace:$scope.startplace,
                        startPlaceCode:$scope.startplaceval,
                        arrivalPlace:$scope.endplace,
                        arrivalPlaceCode:$scope.endplaceval,
                        startTime:$scope.starttime,
                        budget:Number($scope.goTraffic),
                        invoiceType: INVOICE_TYPE.PLANE
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
                        startPlace:$scope.endplace,
                        startPlaceCode:$scope.endplaceval,
                        arrivalPlace:$scope.startplace,
                        arrivalPlaceCode:$scope.startplaceval,
                        startTime:$scope.endtime,
                        budget:Number($scope.backTraffic),
                        invoiceType: INVOICE_TYPE.PLANE
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
                        $scope.orderId = result.id;
                        $(".bottom1").hide();
                        $(".bottom2").show();
                        $('.createtime').html("生成时间："+$filter('date')($scope.createTime,'yyyy-MM-dd'));
                    })
                    .catch(function(err){
                        TLDAlert(err.msg || err);
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
        //上传票据
        $scope.upLoad = function () {
            window.location.href = "#/travelPlan/PlanDetail?planId="+$scope.orderId;
        }
    }


    return businessTravel;
})();

module.exports = businessTravel;