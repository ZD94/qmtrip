/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var businesstravel=(function(){

    API.require("auth");
    API.require("place");
    API.require("staff");
    API.require("travelPolicy");
    API.require("tripPlan");
    API.require("travelBudget");

    var  businesstravel = {};

    /*
        我要出差首页
     * @param $scope
     * @constructor
     */
    businesstravel.IndexController = function($scope) {
        $("title").html("我要出差");
        loading(true);

        //选择项目
        $scope.selectPurposeName = function () {
            API.onload(function() {
                API.place.hotCities({})
                    .then(function(result){
                        selectPage('#selectPurpose',result,{
                            isAllowAdd: false,
                            showDefault: true,
                            title: '最新项目',
                            placeholder: '输入项目具体名称',
                            limit: 10
                        });
                    })
                    .catch(function(err){
                        console.info (err);
                    })
            })
        }

        //获取选择状态
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
        $scope.nextStep = function () {
            $scope.purposename = $('#selectPurpose').html();
            if ($scope.purposename=="请输入项目具体名称") {
                alert("项目名称不能为空");
                return false;
            }
            if ($(".trafficimg").css('display')=='block' && $(".liveimg").css('display')=='none'){
                window.location.href = "#/businesstravel/trafficlive?purposename="+$scope.purposename+"&tra=1&liv=0";
            }
            if ($(".trafficimg").css('display')=='none' && $(".liveimg").css('display')=='block') {
                window.location.href = "#/businesstravel/trafficlive?purposename="+$scope.purposename+"&tra=0&liv=1";
            }
            if ($(".trafficimg").css('display')=='block' && $(".liveimg").css('display')=='block') {
                window.location.href = "#/businesstravel/trafficlive?purposename="+$scope.purposename+"&tra=1&liv=1";
            }
        }
    }

    /*
     我要出差选择交通
     * @param $scope
     * @constructor
     */
    businesstravel.TrafficliveController = function($scope , $routeParams) {
        $("title").html("我要出差");
        loading(true);

        $scope.tra = $routeParams.tra;
        $scope.liv = $routeParams.liv;

        var purposename = $routeParams.purposename,
            tra = $routeParams.tra,
            liv = $routeParams.liv;

        //只选交通
        if ($scope.tra == 1 && $scope.liv == 0) {

            $('.traffic_step').show();
            $('.live_step').hide();

            //选择出发城市
            $scope.selectStartCity = function () {
                API.onload(function() {
                    API.place.hotCities({})
                        .then(function(result){
                            selectPage('#startPlace',result,{
                                isAllowAdd: false,
                                showDefault: true,
                                title: '热门城市',
                                placeholder: '输入城市名称进行搜索',
                                limit: 10
                            });
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }

            //选择目的地城市
            $scope.selectEndCity = function () {
                API.onload(function() {
                    API.place.hotCities({})
                        .then(function(result){
                            selectPage('#endPlace',result,{
                                isAllowAdd: false,
                                showDefault: true,
                                title: '热门城市',
                                placeholder: '输入城市名称进行搜索',
                                limit: 10
                            });
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }


            //返回首页
            $scope.returnUrl = function () {
                window.location.href = "#/businesstravel/index";
            }

            //生成预算
            $scope.createResult = function () {
                var startPlace = $('#startPlace').html(),
                    endPlace = $('#endPlace').html(),
                    startPlaceVal = $('#startPlace').attr("code"),
                    endPlaceVal = $('#endPlace').attr("code"),
                    startTime = $('#startTime').html(),
                    endTime =  $('#endTime').html(),
                    startTimeLate =  $('#startTimeLate').val(),
                    endTimeLate =  $('#endTimeLate').val();
                window.location.href = "#/businesstravel/createresult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&sp="+startPlace+"&ep="+endPlace+"&spval="+startPlaceVal+"&epval="+endPlaceVal+"&stime="+startTime+"&etime="+endTime+"&stimel="+startTimeLate+"&etimel="+endTimeLate;
            }
        }



        //只选住宿
        if ($scope.tra == 0 && $scope.liv == 1) {

            $('.traffic_step').hide();
            $('.live_step').show();

            //选择住宿城市
            $scope.selectLiveCity = function () {
                API.onload(function() {
                    API.place.hotCities({})
                        .then(function(result){
                            selectPage('#livePlace',result,{
                                isAllowAdd: false,
                                showDefault: true,
                                title: '目的地城市',
                                placeholder: '输入城市名称进行搜索',
                                limit: 10
                            });
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }

            //选择地标
            $scope.selectLivePlace = function () {
                API.onload(function() {
                    API.place.hotBusinessDistricts({code:$("#livePlace").attr("code")})
                        .then(function(result){
                            console.info (result);
                            selectPage('#landmark',result,{
                                isAllowAdd: false,
                                showDefault: true,
                                title: '热门地标',
                                placeholder: '输入城市名称进行搜索',
                                limit: 10
                            });
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }


            //返回首页
            $scope.returnUrl = function () {
                window.location.href = "#/businesstravel/index";
            }

            //生成预算
            $scope.createResult = function () {
                var livePlace = $('#livePlace').html(),
                    leavePlace = $('#leavePlace').html(),
                    livePlaceVal = $('#livePlace').attr("code"),
                    landmarkVal = $('#landmark').attr("code"),
                    liveTime = $('#liveTime').html(),
                    leaveTime = $('#leaveTime').html();
                window.location.href = "#/businesstravel/createresult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&livep="+livePlace+"&lpval="+livePlaceVal+"&lmval="+landmarkVal+"&livetime="+liveTime+"&leavetime="+leaveTime;
            }
        }

        //选择交通和住宿
        if ($scope.tra == 1 && $scope.liv == 1) {
            $('.traffic_step').show();
            $('.live_step').hide();

            //选择出发城市
            $scope.selectStartCity = function () {
                API.onload(function() {
                    API.place.hotCities({})
                        .then(function(result){
                            selectPage('#startPlace',result,{
                                isAllowAdd: false,
                                showDefault: true,
                                title: '热门城市',
                                placeholder: '输入城市名称进行搜索',
                                limit: 10
                            });
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }

            //选择目的地城市
            $scope.selectEndCity = function () {
                API.onload(function() {
                    API.place.hotCities({})
                        .then(function(result){
                            selectPage('#endPlace',result,{
                                isAllowAdd: false,
                                showDefault: true,
                                title: '热门城市',
                                placeholder: '输入城市名称进行搜索',
                                limit: 10
                            });
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }

            //选择住宿城市
            $scope.selectLiveCity = function () {
                API.onload(function() {
                    API.place.hotCities({})
                        .then(function(result){
                            selectPage('#livePlace',result,{
                                isAllowAdd: false,
                                showDefault: true,
                                title: '目的地城市',
                                placeholder: '输入城市名称进行搜索',
                                limit: 10
                            });
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }

            //选择地标
            $scope.selectLivePlace = function () {
                API.onload(function() {
                    API.place.hotBusinessDistricts({code:$("#livePlace").attr("code")})
                        .then(function(result){
                            console.info (result);
                            selectPage('#landmark',result,{
                                isAllowAdd: false,
                                showDefault: true,
                                title: '热门地标',
                                placeholder: '输入城市地标进行搜索',
                                limit: 10
                            });
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }


            //返回首页
            $scope.returnUrl = function () {
                window.location.href = "#/businesstravel/index";
            }

            //上一步
            $scope.prevStep = function () {
                $('.traffic_step').fadeIn();
                $('.live_step').fadeOut();
            }

            //下一步
            $scope.nextStep = function () {
                $('.traffic_step').fadeOut();
                $('.live_step').fadeIn();
            }

            //生成预算单
            $scope.createResult = function () {
                var startPlace = $('#startPlace').html(),
                    endPlace = $('#endPlace').html(),
                    startPlaceVal = $('#startPlace').attr("code"),
                    endPlaceVal = $('#endPlace').attr("code"),
                    startTime = $('#startTime').html(),
                    endTime =  $('#endTime').html(),
                    startTimeLate =  $('#startTimeLate').val(),
                    endTimeLate =  $('#endTimeLate').val(),
                    livePlace = $('#livePlace').html(),
                    leavePlace = $('#leavePlace').html(),
                    livePlaceVal = $('#livePlace').attr("code"),
                    landmark = $('#landmark').html(),
                    landmarkVal = $('#landmark').attr("code"),
                    liveTime = $('#liveTime').html(),
                    leaveTime = $('#leaveTime').html();
                window.location.href = "#/businesstravel/createresult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&sp="+startPlace+"&ep="+endPlace+"&spval="+startPlaceVal+"&epval="+endPlaceVal+"&stime="+startTime+"&etime="+endTime+"&stimel="+startTimeLate+"&etimel="+endTimeLate+"&livep="+livePlace+"&lpval="+livePlaceVal+"&lm="+landmark+"&lmval="+landmarkVal+"&livetime="+liveTime+"&leavetime="+leaveTime;
            }

        }

        //选择日期
        $scope.chooeseData = function($event){
            var thismonth = moment().startOf('month').format('M');
            mobileSelectDate({
                isShowMonth: true
            }, {
                month: thismonth,
                year: 2016,
                displayMonthNum: 12
            })
                .then(function(selectedDate) {
                    $($event.target).html(selectedDate);
                })
                .catch(function(err) {
                    console.error(err);
                })
        }


    }

    /*
     我要出差动态预算结果
     * @param $scope
     * @constructor
     */
    businesstravel.CreateresultController = function($scope , $routeParams) {
        $("title").html("动态预算结果");
        loading(true);

        $scope.purposename = $routeParams.purposename;
        $scope.tra = $routeParams.tra;
        $scope.liv = $routeParams.liv;
        console.info ($routeParams);


        //只选交通
        if ($scope.tra == 1 && $scope.liv == 0) {
            $scope.startPlace = $routeParams.sp;
            $scope.endPlace = $routeParams.ep;
            $scope.startPlaceVal = $routeParams.spval;
            $scope.endPlaceVal = $routeParams.epval;
            $scope.startTime = $routeParams.stime;
            $scope.endTime =  $routeParams.etime;
            $scope.startTimeLate =  $routeParams.stimel;
            $scope.endTimeLate =  $routeParams.etimel;

            API.onload(function() {
                Q.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getTrafficBudget({
                        originPlace:$scope.startPlaceVal,
                        destinationPlace:$scope.endPlaceVal,
                        outboundDate:$scope.startTime,
                        inboundDate:$scope.endTime,
                        outLatestArriveTime:$scope.startTimeLate,
                        inLatestArriveTime:$scope.endTimeLate,
                        isRoundTrip:$scope.endTime
                    })
                ])
                    .spread(function(ret1,ret2) {
                        $('.loading_result').hide();
                        black_err("预算生成成功");
                        $scope.onlytraffic = ret2;
                        $scope.totalprice = ret2.price;
                        $scope.goTraffic = ret2.goTraffic.price;
                        $scope.backTraffic = ret2.backTraffic.price;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                        black_err("预算生成失败,请重新生成");
                    });
            })
        }

        //只选住宿
        if ($scope.tra == 0 && $scope.liv == 1) {
            $scope.livePlaceVal = $routeParams.lpval;
            $scope.landmarkVal = $routeParams.lmval;
            $scope.liveTime = $routeParams.livetime;
            $scope.leaveTime =  $routeParams.leavetime;

            API.onload(function() {
                Q.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getHotelBudget({
                        cityId:$scope.livePlaceVal,
                        businessDistrict:$scope.landmarkVal,
                        checkInDate: $scope.liveTime,
                        checkOutDate: $scope.leaveTime
                    })
                ])
                    .spread(function(ret1,ret2) {
                        $('.loading_result').hide();
                        black_err("预算生成成功");
                        $scope.onlylive = ret2;
                        $scope.totalprice = ret2.price;
                        $scope.liveprice = $scope.onlylive.price;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                        black_err("预算生成失败,请重新生成");
                    });
            })
        }

        //选择交通和住宿
        if ($scope.tra == 1 && $scope.liv == 1) {
            $scope.startPlace = $routeParams.sp;
            $scope.endPlace = $routeParams.ep;
            $scope.startPlaceVal = $routeParams.spval;
            $scope.endPlaceVal = $routeParams.epval;
            $scope.startTime = $routeParams.stime;
            $scope.endTime =  $routeParams.etime;
            $scope.startTimeLate =  $routeParams.stimel;
            $scope.endTimeLate =  $routeParams.etimel;
            $scope.livePlaceVal = $routeParams.lpval;
            $scope.landmarkVal = $routeParams.lmval;
            $scope.landmark = $routeParams.lm;
            $scope.liveTime = $routeParams.livetime;
            $scope.leaveTime =  $routeParams.leavetime;
            API.onload(function() {
                Q.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getTravelPolicyBudget({
                        originPlace:$scope.startPlaceVal,
                        destinationPlace:$scope.endPlaceVal,
                        outboundDate:$scope.startTime,
                        inboundDate:$scope.endTime,
                        outLatestArriveTime:$scope.startTimeLate,
                        inLatestArriveTime:$scope.endTimeLate,
                        businessDistrict:$scope.landmarkVal,
                        checkInDate:$scope.liveTime,
                        checkOutDate:$scope.leaveTime,
                        isRoundTrip:$scope.endTime
                    })
                ])
                    .spread(function(ret1,ret2) {
                        $('.loading_result').hide();
                        black_err("预算生成成功");
                        $scope.trafficlive = ret2;
                        $scope.totalprice = ret2.price;
                        $scope.trafficprice = $scope.trafficlive.traffic;
                        $scope.liveprice = $scope.trafficlive.hotel;
                        $scope.goTraffic = ret2.goTraffic.price;
                        $scope.backTraffic = ret2.backTraffic.price;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                        black_err("预算生成失败,请重新生成");
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
                    startPlace:$scope.startPlace,
                    startPlaceCode:$scope.startPlaceVal,
                    destination:$scope.endPlace,
                    destinationCode:$scope.endPlaceVal,
                    startAt:$scope.startTime,
                    startTime:$scope.liveTime,
                    endTime:$scope.leaveTime,
                    budget:Number($scope.totalprice),
                    isNeedTraffic:$scope.tra,
                    isNeedHotel:$scope.liv,
                    remark:$scope.startPlace+$scope.endPlace+$scope.startTime+$scope.livePlace+$scope.liveTime
                }
                if ($scope.endTime) {
                    order.backAt = $scope.endTime;
                }
                if ($scope.liv==1 && $scope.tra==0) {
                    order.startAt = $scope.liveTime;
                }
                //住宿
                if($scope.liv==1){
                    var consumeDetails_hotel = {
                        type:0,
                        city:$scope.endPlace,
                        cityCode:$scope.endPlaceVal,
                        hotelName:$scope.landmark,
                        startTime:$scope.liveTime,
                        endTime:$scope.leaveTime,
                        budget:Number($scope.liveprice),
                        invoiceType:2
                    }
                    consumeDetails.push(consumeDetails_hotel);
                }

                //去程
                if($scope.starttime){
                    var consumeDetails_outTraffic = {
                        type:-1,
                        startPlace:$scope.startPlace,
                        startPlaceCode:$scope.startPlaceVal,
                        arrivalPlace:$scope.endPlace,
                        arrivalPlaceCode:$scope.endPlaceVal,
                        startTime:$scope.startTime,
                        budget:Number($scope.goTraffic),
                        invoiceType:1
                    }
                    if($scope.endtime){
                        consumeDetails_outTraffic.endTime = $scope.endTime;
                    }
                    if($scope.starttimelate){
                        consumeDetails_outTraffic.latestArriveTime = $scope.startTime+' '+$scope.startTimeLate;
                    }
                    consumeDetails.push(consumeDetails_outTraffic);
                }

                //回程
                if($scope.endtime){
                    var consumeDetails_backTraffic = {
                        type:1,
                        startPlace:$scope.endPlace,
                        startPlaceCode:$scope.endPlaceVal,
                        arrivalPlace:$scope.startPlace,
                        arrivalPlaceCode:$scope.startPlaceVal,
                        startTime:$scope.endTime,
                        budget:Number($scope.backTraffic),
                        invoiceType:1
                    }
                    if($scope.endtimelate){
                        consumeDetails_backTraffic.latestArriveTime = $scope.endTime+' '+$scope.endTimeLate;
                    }
                    consumeDetails.push(consumeDetails_backTraffic);
                }
                order.consumeDetails = consumeDetails;
                API.tripPlan.savePlanOrder(order)
                    .then(function(result){
                        console.info (result);
                        black_err("生成计划单成功");
                    })
                    .catch(function(err){
                        console.info (err);
                        black_err("生成计划单失败");
                    });
            })
        }

        //上一步
        $scope.prevStep = function () {
            if ($scope.tra == 1 && $scope.liv == 0) {
                window.location.href = "#/businesstravel/trafficlive?purposename="+$scope.purposename+"&tra=1&liv=0";
            }
            if ($scope.tra == 0 && $scope.liv == 1) {
                window.location.href = "#/businesstravel/trafficlive?purposename="+$scope.purposename+"&tra=0&liv=1";
            }
            if ($scope.tra == 1 && $scope.liv == 1) {
                window.location.href = "#/businesstravel/trafficlive?purposename="+$scope.purposename+"&tra=1&liv=1";
            }
        }


    }

    return businesstravel;
})();

module.exports = businesstravel;