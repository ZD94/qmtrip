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
        $scope.$root.pageTitle = '我要出差';
        //console.info($scope.$root.pageTitle);
        loading(true);
        //选择项目
        $scope.selectPurposeName = function () {
            API.onload(function() {
                API.tripPlan.getProjectsList({})
                    .then(function(result){
                        return selectPage({
                            defaultDataFunc: function() {
                                return new Promise(function(resolve) {
                                    resolve(result);
                                    console.info (result);
                                });
                            },
                            fetchDataFunc: function(keyword) {
                                return new Promise(function(resolve) {
                                    resolve(API.tripPlan.getProjectsList({project_name:keyword}));
                                });
                            },
                            isAllowAdd: true,
                            showDefault: true,
                            displayNameKey: "",
                            valueKey: "",
                            title: '最新项目',
                            placeholder: '输入项目具体名称'
                        });
                    })
                    .spread(function(cityId, cityName) {
                        $scope.purposename = cityName;
                        $scope.cityId = cityId;
                        $('#selectPurpose').attr('code',$scope.cityId);
                        $scope.$apply();
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
            if ($scope.purposename=="" || $scope.purposename==undefined) {
                Myalert("温馨提示","请填写出差目的");
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
        $scope.$root.pageTitle = '我要出差';
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
                            return selectPage({
                                defaultDataFunc: function() {
                                    return new Promise(function(resolve) {
                                        resolve(result);
                                        console.info (result);
                                    });
                                },
                                fetchDataFunc: function(keyword) {
                                    return new Promise(function(resolve) {
                                        resolve(API.place.queryPlace({keyword:keyword}));
                                    });
                                },
                                isAllowAdd: false,
                                showDefault: true,
                                displayNameKey: "name",
                                valueKey: "id",
                                title: '常用城市',
                                placeholder: '输入城市名称'
                            });
                        })
                        .spread(function(startCityId, cityName) {
                            $scope.startCity = cityName;
                            $scope.startCityId = startCityId;
                            $('#startCity').attr('code',$scope.startCityId);
                            $scope.$apply();
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
                            return selectPage({
                                defaultDataFunc: function() {
                                    return new Promise(function(resolve) {
                                        resolve(result);
                                        console.info (result);
                                    });
                                },
                                fetchDataFunc: function(keyword) {
                                    return new Promise(function(resolve) {
                                        resolve(API.place.queryPlace({keyword:keyword}));
                                    });
                                },
                                isAllowAdd: false,
                                showDefault: true,
                                displayNameKey: "name",
                                valueKey: "id",
                                title: '常用城市',
                                placeholder: '输入城市名称'
                            });
                        })
                        .spread(function(endCityId, cityName) {
                            $scope.endCity = cityName;
                            $scope.endCityId = endCityId;
                            $('#endCity').attr('code',$scope.endCityId);
                            $scope.$apply();
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
                var startCity = $scope.startCity,
                    endCity = $scope.endCity,
                    startCityVal = $('#startCity').attr("code"),
                    endCityVal = $('#endCity').attr("code"),
                    startTime = $('#startTime').val(),
                    endTime =  $('#endTime').val(),
                    startTimeLate =  $('#startTimeLate').val(),
                    endTimeLate =  $('#endTimeLate').val();

                var dateReg = /^\d{4}-\d{2}-\d{2}$/;
                var timeReg = /^\d{2}:\d{2}$/;

                if (startCity == "" || startCity == undefined) {
                    msgbox.log("请选择出发城市");
                    return false;
                }
                if (endCity == "" || endCity == undefined) {
                    msgbox.log("请选择目的地城市");
                    return false;
                }
                if (!startTime || !dateReg.test(startTime)) {
                    msgbox.log("出发日期不存在或格式不正确");
                    return false;
                }
                if (!dateReg.test(endTime)&&endTime!="") {
                    msgbox.log("返程日期格式不正确");
                    return false;
                }
                if (startTime>endTime&&endTime!="") {
                    msgbox.log("返程日期不能小于出发日期");
                    return false;
                }
                if (startCity == endCity) {
                    msgbox.log("出发城市与目的地城市不能相同");
                    return false;
                }
                if (!timeReg.test(endTimeLate)&&endTimeLate!="") {
                    msgbox.log("最晚到达时间格式时间格式不正确");
                    return false;
                }
                if (!timeReg.test(startTimeLate)&&startTimeLate!="") {
                    msgbox.log("最晚到达时间格式时间格式不正确");
                    return false;
                }



                window.location.href = "#/businesstravel/createresult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&sc="+startCity+"&ec="+endCity+"&scval="+startCityVal+"&ecval="+endCityVal+"&stime="+startTime+"&etime="+endTime+"&stimel="+startTimeLate+"&etimel="+endTimeLate;
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
                            return selectPage({
                                defaultDataFunc: function() {
                                    return new Promise(function(resolve) {
                                        resolve(result);
                                        console.info (result);
                                    });
                                },
                                fetchDataFunc: function(keyword) {
                                    return new Promise(function(resolve) {
                                        resolve(API.place.queryPlace({keyword:keyword}));
                                    });
                                },
                                isAllowAdd: false,
                                showDefault: true,
                                displayNameKey: "name",
                                valueKey: "id",
                                title: '常用城市',
                                placeholder: '输入城市名称'
                            });
                        })
                        .spread(function(liveCityId, cityName) {
                            $scope.liveCity = cityName;
                            $scope.liveCityId = liveCityId;
                            $('#liveCity').attr('code',$scope.liveCityId);
                            $scope.$apply();
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }

            //选择地标
            $scope.selectLivePlace = function () {
                API.onload(function() {
                    API.place.hotBusinessDistricts({code:$("#liveCity").attr("code")})
                        .then(function(result){
                            return selectPage({
                                defaultDataFunc: function() {
                                    return new Promise(function(resolve) {
                                        resolve(result);
                                        console.info (result);
                                    });
                                },
                                fetchDataFunc: function(keyword) {
                                    return new Promise(function(resolve) {
                                        resolve(API.place.queryBusinessDistrict({keyword:keyword,code:$("#liveCity").attr("code")}));
                                    });
                                },
                                isAllowAdd: false,
                                showDefault: true,
                                displayNameKey: "name",
                                valueKey: "id",
                                title: '地标选择',
                                placeholder: '输入地标名称'
                            });
                        })
                        .spread(function(livePlaceId, livePlace) {
                            $scope.livePlace = livePlace;
                            $scope.livePlaceId = livePlaceId;
                            $('#livePlace').val($scope.livePlace);
                            $('#livePlace').attr('code',$scope.livePlaceId);
                            $scope.$apply();
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
                var liveCity = $scope.liveCity,
                    livePlace = $scope.livePlace,
                    liveCityVal = $('#liveCity').attr("code"),
                    livePlaceVal = $('#livePlace').attr("code"),
                    liveTime = $('#liveTime').val(),
                    leaveTime = $('#leaveTime').val();
                var dateReg = /^\d{4}-\d{2}-\d{2}$/;
                if (liveCity == "" || liveCity == undefined) {
                    msgbox.log("请选择目的地城市");
                    return false;
                }
                if (!liveTime || !dateReg.test(liveTime)) {
                    msgbox.log("入住日期不存在或格式不正确");
                    return false;
                }
                if (!leaveTime || !dateReg.test(leaveTime)) {
                    msgbox.log("离店日期不存在或格式不正确");
                    return false;
                }
                if (liveTime>leaveTime&&leaveTime!="") {
                    msgbox.log("离店日期不能小于入住日期");
                    return false;
                }
                window.location.href = "#/businesstravel/createresult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&livec="+liveCity+"&livep="+livePlace+"&lcval="+liveCityVal+"&lpval="+livePlaceVal+"&livetime="+liveTime+"&leavetime="+leaveTime;
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
                            return selectPage({
                                defaultDataFunc: function() {
                                    return new Promise(function(resolve) {
                                        resolve(result);
                                        console.info (result);
                                    });
                                },
                                fetchDataFunc: function(keyword) {
                                    return new Promise(function(resolve) {
                                        resolve(API.place.queryPlace({keyword:keyword}));
                                    });
                                },
                                isAllowAdd: false,
                                showDefault: true,
                                displayNameKey: "name",
                                valueKey: "id",
                                title: '常用城市',
                                placeholder: '输入城市名称'
                            });
                        })
                        .spread(function(startCityId, cityName) {
                            $('#startCity').val(cityName);
                            $('#startCity').attr('code',startCityId);
                            $scope.$apply();
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
                            return selectPage({
                                defaultDataFunc: function() {
                                    return new Promise(function(resolve) {
                                        resolve(result);
                                        console.info (result);
                                    });
                                },
                                fetchDataFunc: function(keyword) {
                                    return new Promise(function(resolve) {
                                        resolve(API.place.queryPlace({keyword:keyword}));
                                    });
                                },
                                isAllowAdd: false,
                                showDefault: true,
                                displayNameKey: "name",
                                valueKey: "id",
                                title: '常用城市',
                                placeholder: '输入城市名称'
                            });
                        })
                        .spread(function(endCityId, cityName) {
                            $('#endCity').val(cityName);
                            $('#endCity').attr('code',endCityId);
                            $scope.$apply();
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
                            return selectPage({
                                defaultDataFunc: function() {
                                    return new Promise(function(resolve) {
                                        resolve(result);
                                        console.info (result);
                                    });
                                },
                                fetchDataFunc: function(keyword) {
                                    return new Promise(function(resolve) {
                                        resolve(API.place.queryPlace({keyword:keyword}));
                                    });
                                },
                                isAllowAdd: false,
                                showDefault: true,
                                displayNameKey: "name",
                                valueKey: "id",
                                title: '常用城市',
                                placeholder: '输入城市名称'
                            });
                        })
                        .spread(function(liveCityId, cityName) {
                            $('#liveCity').val(cityName);
                            $('#liveCity').attr('code',liveCityId);
                            $scope.$apply();
                        })
                        .catch(function(err){
                            console.info (err);
                        })
                })
            }


            //选择地标
            $scope.selectLivePlace = function () {
                API.onload(function() {
                    API.place.hotBusinessDistricts({code:$("#liveCity").attr("code")})
                        .then(function(result){
                            return selectPage({
                                defaultDataFunc: function() {
                                    return new Promise(function(resolve) {
                                        resolve(result);
                                        console.info (result);
                                    });
                                },
                                fetchDataFunc: function(keyword) {
                                    return new Promise(function(resolve) {
                                        resolve(API.place.queryBusinessDistrict({keyword:keyword,code:$("#liveCity").attr("code")}));
                                    });
                                },
                                isAllowAdd: false,
                                showDefault: true,
                                displayNameKey: "name",
                                valueKey: "id",
                                title: '地标选择',
                                placeholder: '输入地标名称'
                            });
                        })
                        .spread(function(livePlaceId, livePlace) {
                            $('#livePlace').val(livePlace);
                            $('#livePlace').attr('code',livePlaceId);
                            $scope.$apply();
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
                var startCity = $('#startCity').val(),
                    endCity = $('#endCity').val(),
                    startCityVal = $('#startCity').attr("code"),
                    endCityVal = $('#endCity').attr("code"),
                    startTime = $('#startTime').val(),
                    endTime =  $('#endTime').val(),
                    startTimeLate =  $('#startTimeLate').val(),
                    endTimeLate =  $('#endTimeLate').val();

                var dateReg = /^\d{4}-\d{2}-\d{2}$/;
                var timeReg = /^\d{2}:\d{2}$/;
                if (startCity == "" || startCity == undefined) {
                    msgbox.log("请选择出发城市");
                    return false;
                }
                if (endCity == "" || endCity == undefined) {
                    msgbox.log("请选择目的地城市");
                    return false;
                }
                if (!startTime || !dateReg.test(startTime)) {
                    msgbox.log("出发日期不存在或格式不正确");
                    return false;
                }
                if (!dateReg.test(endTime)&&endTime!="") {
                    msgbox.log("返程日期格式不正确");
                    return false;
                }
                if (startTime>endTime&&endTime!="") {
                    msgbox.log("返程日期不能小于出发日期");
                    return false;
                }
                if (startCity == endCity) {
                    msgbox.log("出发城市与目的地城市不能相同");
                    return false;
                }
                if (!timeReg.test(endTimeLate)&&endTimeLate!="") {
                    msgbox.log("最晚到达时间格式时间格式不正确");
                    return false;
                }
                if (!timeReg.test(startTimeLate)&&startTimeLate!="") {
                    msgbox.log("最晚返回时间格式时间格式不正确");
                    return false;
                }


                $('.traffic_step').fadeOut();
                $('.live_step').fadeIn();
                $('#liveCity').val($('#endCity').val());
                $('#liveCity').attr('code',$('#endCity').attr('code'));
                $('#liveTime').val($('#startTime').val());
                $('#leaveTime').val($('#endTime').val());
                $scope.liveCityId = $('#liveCity').attr('code');
            }

            //生成预算单
            $scope.createResult = function () {
                var startCity = $('#startCity').val(),
                    endCity = $('#endCity').val(),
                    startCityVal = $('#startCity').attr("code"),
                    endCityVal = $('#endCity').attr("code"),
                    startTime = $('#startTime').val(),
                    endTime =  $('#endTime').val(),
                    startTimeLate =  $('#startTimeLate').val(),
                    endTimeLate =  $('#endTimeLate').val(),
                    liveCity = $('#liveCity').val(),
                    livePlace = $('#livePlace').val(),
                    liveCityVal = $('#liveCity').attr("code"),
                    livePlaceVal = $('#livePlace').attr("code"),
                    liveTime = $('#liveTime').val(),
                    leaveTime = $('#leaveTime').val();
                var dateReg = /^\d{4}-\d{2}-\d{2}$/;
                if (liveCity == "" || liveCity == undefined) {
                    msgbox.log("请选择目的地城市");
                    return false;
                }
                if (!liveTime || !dateReg.test(liveTime)) {
                    msgbox.log("入住日期不存在或格式不正确");
                    return false;
                }
                if (!leaveTime || !dateReg.test(leaveTime)) {
                    msgbox.log("离店日期不存在或格式不正确");
                    return false;
                }
                if (liveTime>leaveTime&&leaveTime!="") {
                    msgbox.log("离店日期不能小于入住日期");
                    return false;
                }
                window.location.href = "#/businesstravel/createresult?purposename="+purposename+"&tra="+tra+"&liv="+liv+"&sc="+startCity+"&ec="+endCity+"&scval="+startCityVal+"&ecval="+endCityVal+"&stime="+startTime+"&etime="+endTime+"&stimel="+startTimeLate+"&etimel="+endTimeLate+"&livec="+liveCity+"&livep="+livePlace+"&lcval="+liveCityVal+"&lpval="+livePlaceVal+"&livetime="+liveTime+"&leavetime="+leaveTime;
            }

        }

        var calendar = require("calendar");

        //选择日期
        $scope.chooeseData = function($event, begintime){
            if(begintime){
                begintime = $('#'+begintime).val();
                if(! begintime.match(/\d{4}-\d{2}-\d{2}/))
                    begintime = undefined;
            }
            calendar.selectDate({
                accept_begin: begintime,
                selected: $event.target.value,
                displayMonthNum: 12
            })
                .then(function(selectedDate) {
                    $($event.target).val(selectedDate);
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
        $scope.$root.pageTitle = '动态预算结果';
        loading(true);

        $scope.purposename = $routeParams.purposename;
        $scope.tra = $routeParams.tra;
        $scope.liv = $routeParams.liv;

        //返回首页
        $scope.returnUrl = function () {
            window.location.href = "#/businesstravel/index";
        }
        //只选交通
        if ($scope.tra == 1 && $scope.liv == 0) {
            $scope.startPlace = $routeParams.sc;
            $scope.endPlace = $routeParams.ec;
            $scope.startPlaceVal = $routeParams.scval;
            $scope.endPlaceVal = $routeParams.ecval;
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
                        //msgbox.log("预算生成成功");
                        $scope.onlytraffic = ret2;
                        $scope.totalprice = ret2.price;
                        $scope.goTraffic = ret2.goTraffic.price;
                        $scope.backTraffic = ret2.backTraffic.price;
                        $scope.$apply();

                    })
                    .catch(function(err){
                        console.info (err);
                        window.location.href = "#/businesstravel/fail";
                    });
            })
        }

        //只选住宿
        if ($scope.tra == 0 && $scope.liv == 1) {
            $scope.livePlaceVal = $routeParams.lcval;
            $scope.landmarkVal = $routeParams.lpval;
            $scope.endPlace = $routeParams.livec;
            $scope.landmark = $routeParams.livep;
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
                        //msgbox.log("预算生成成功");
                        $scope.onlylive = ret2;
                        $scope.totalprice = ret2.price;
                        $scope.liveprice = $scope.onlylive.price;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                        window.location.href = "#/businesstravel/fail";
                    });
            })
        }

        //选择交通和住宿
        if ($scope.tra == 1 && $scope.liv == 1) {
            $scope.startPlace = $routeParams.sc;
            $scope.endPlace = $routeParams.ec;
            $scope.startPlaceVal = $routeParams.scval;
            $scope.endPlaceVal = $routeParams.ecval;
            $scope.startTime = $routeParams.stime;
            $scope.endTime =  $routeParams.etime;
            $scope.startTimeLate =  $routeParams.stimel;
            $scope.endTimeLate =  $routeParams.etimel;
            $scope.livePlace = $routeParams.lc;
            $scope.livePlaceVal = $routeParams.lcval;
            $scope.landmarkVal = $routeParams.lpval;
            $scope.landmark = $routeParams.livep;
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
                        console.info(ret2);
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
                        window.location.href = "#/businesstravel/fail";
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
                    destinationCode:$scope.livePlaceVal,
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
                        cityCode:$scope.livePlaceVal,
                        hotelName:$scope.landmark,
                        startTime:$scope.liveTime,
                        endTime:$scope.leaveTime,
                        budget:Number($scope.liveprice),
                        invoiceType: 'HOTEL'
                    }
                    consumeDetails.push(consumeDetails_hotel);
                }

                //去程
                if($scope.startTime){
                    var consumeDetails_outTraffic = {
                        type:-1,
                        startPlace:$scope.startPlace,
                        startPlaceCode:$scope.startPlaceVal,
                        arrivalPlace:$scope.endPlace,
                        arrivalPlaceCode:$scope.endPlaceVal,
                        startTime:$scope.startTime,
                        budget:Number($scope.goTraffic),
                        invoiceType: 'PLANE'
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
                if($scope.endTime){
                    var consumeDetails_backTraffic = {
                        type:1,
                        startPlace:$scope.endPlace,
                        startPlaceCode:$scope.endPlaceVal,
                        arrivalPlace:$scope.startPlace,
                        arrivalPlaceCode:$scope.startPlaceVal,
                        startTime:$scope.endTime,
                        budget:Number($scope.backTraffic),
                        invoiceType: 'PLANE'
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
                        msgbox.log("已成功生成出差记录");
                        function plandetail () {
                            window.location.href='#/travelplan/plandetail?orderId='+result.id;
                        }
                        setTimeout(plandetail,3000);
                    })
                    .catch(function(err){
                        console.info (err);
                        msgbox.log("生成失败,请重新生成");
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


    /*
     我要出差首页
     * @param $scope
     * @constructor
     */
    businesstravel.FailController = function($scope) {
        $scope.$root.pageTitle = '错误提示';
        loading(true);
    }

    return businesstravel;
})();

module.exports = businesstravel;