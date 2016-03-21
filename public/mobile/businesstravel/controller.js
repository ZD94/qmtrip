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
        loading(true);

        if (sessionStorage.isTraffic == undefined) {
            sessionStorage.isTraffic = 'false';
        }
        if (sessionStorage.isHotel == undefined) {
            sessionStorage.isHotel = 'false';
        }
        $scope.purposeName = sessionStorage.purposeName;
        $scope.isTraffic = sessionStorage.isTraffic;
        $scope.isHotel = sessionStorage.isHotel;
        //选择项目
        $scope.selectPurposeName = function () {
            API.onload(function() {
                API.tripPlan.getProjectsList({})
                    .then(function(result){
                        return selectPage({
                            defaultDataFunc: function() {
                                return new Promise(function(resolve) {
                                    resolve(result);
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
                    .spread(function(purposeCode, purposeName) {
                        $scope.purposeName = purposeName;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                    })
            })
        };

        //获取交通选择状态
        $scope.chooseTraffic = function () {
            if ($scope.isTraffic != 'true') {
                $scope.isTraffic = 'true';
            }
            else if ($scope.isTraffic == 'true') {
                $scope.isTraffic = 'false';
            }
        };
        //获取住宿选择状态
        $scope.chooseHotel = function () {
            if ($scope.isHotel != 'true') {
                $scope.isHotel = 'true';
            }
            else if ($scope.isHotel = 'true') {
                $scope.isHotel = 'false';
            }
        };

        //下一步
        $scope.nextStep = function () {
            sessionStorage.purposeName = $scope.purposeName;
            sessionStorage.isTraffic = $scope.isTraffic;
            sessionStorage.isHotel = $scope.isHotel;
            if ($scope.isTraffic == 'true') {
                window.location.href = "#/businesstravel/traffic";
            }
            else if ($scope.isTraffic == 'false') {
                window.location.href = "#/businesstravel/hotel";
            }
        }
    }

    /*
     我要出差选择交通
     * @param $scope
     * @constructor
     */
    businesstravel.TrafficController = function($scope) {
        $scope.$root.pageTitle = '我要出差';
        loading(true);

        //遍历存储数据为undefined
        for (var i = 0, len = sessionStorage.length; i < len; i++) {
            var key = sessionStorage.key(i);
            var value = sessionStorage.getItem(key);
            if (value == "undefined") {
                sessionStorage.setItem(key,"");
            }
        }
        $scope.purposeName = sessionStorage.purposeName;
        $scope.isTraffic = sessionStorage.isTraffic;
        $scope.isHotel = sessionStorage.isHotel;
        $scope.startCityName = sessionStorage.startCityName;
        $scope.startCityCode = sessionStorage.startCityCode;
        $scope.endCityName = sessionStorage.endCityName;
        $scope.endCityCode = sessionStorage.endCityCode;
        $scope.startDate = sessionStorage.startDate;
        $scope.endDate = sessionStorage.endDate;
        $("#startTimeLate").val(sessionStorage.startTimeLate);
        $("#endTimeLate").val(sessionStorage.endTimeLate);

        console.info (sessionStorage);

        //选择出发城市
        $scope.selectStartCity = function () {
            API.onload(function() {
                API.place.hotCities({})
                    .then(function(result){
                        return selectPage({
                            defaultDataFunc: function() {
                                return new Promise(function(resolve) {
                                    resolve(result);
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
                    .spread(function(startCityCode, startCityName) {
                        $scope.startCityName = startCityName;
                        $scope.startCityCode = startCityCode;
                        $('#startCity').attr('code',$scope.startCityCode);
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
                    .spread(function(endCityCode, endCityName) {
                        $scope.endCityName = endCityName;
                        $scope.endCityCode = endCityCode;
                        $('#endCity').attr('code',$scope.endCityCode);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                    })
            })
        }

        //选择出发日期
        $scope.chooeseStartData = function($event){
            calendar.selectDate({
                displayMonthNum: 12
            })
                .then(function(startDate) {
                    $scope.startDate = startDate;
                    $scope.$apply();
                })
                .catch(function(err) {
                    console.error(err);
                })
        }

        //选择返程日期
        $scope.chooeseEndData = function($event, begintime){
            if(begintime){
                begintime = $scope.startDate;
                if(! begintime.match(/\d{4}-\d{2}-\d{2}/))
                    begintime = undefined;
            }
            calendar.selectDate({
                accept_begin: begintime,
                selected: $event.target.value,
                displayMonthNum: 12
            })
                .then(function(endDate) {
                    $scope.endDate = endDate;
                    $scope.$apply();
                })
                .catch(function(err) {
                    console.error(err);
                })
        }

        $scope.returnUrl = function () {
            window.location.href = "#/businesstravel/index";
        }

        $scope.nextStep = function () {
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            var timeReg = /^\d{2}:\d{2}$/;
            var startTimeLate = $("#startTimeLate").val();
            var endTimeLate = $("#endTimeLate").val();

            if ($scope.startCityName == undefined) {
                msgbox.log("请选择出发城市");
                return false;
            }
            if ($scope.endCityName == undefined) {
                msgbox.log("请选择目的地城市");
                return false;
            }
            if (!$scope.startDate || !dateReg.test($scope.startDate)) {
                msgbox.log("出发日期不存在或格式不正确");
                return false;
            }
            if (!dateReg.test($scope.endDate) && $scope.endDate!=undefined && $scope.endDate!="") {
                msgbox.log("返程日期格式不正确");
                return false;
            }
            if ($scope.startCityName == $scope.endCityName) {
                msgbox.log("出发城市与目的地城市不能相同");
                return false;
            }
            if (!timeReg.test(startTimeLate)&&startTimeLate!="") {
                msgbox.log("最晚到达时间格式时间格式不正确");
                return false;
            }
            if (!timeReg.test(endTimeLate)&&endTimeLate!="") {
                msgbox.log("最晚到达时间格式时间格式不正确");
                return false;
            }
            sessionStorage.startCityName = $scope.startCityName;
            sessionStorage.startCityCode = $scope.startCityCode;
            sessionStorage.endCityName = $scope.endCityName;
            sessionStorage.endCityCode = $scope.endCityCode;
            sessionStorage.startDate = $scope.startDate;
            sessionStorage.endDate = $scope.endDate;
            sessionStorage.startTimeLate = $("#startTimeLate").val();
            sessionStorage.endTimeLate = $("#endTimeLate").val();
            if (sessionStorage.isHotel == 'true') {
                window.location.href = "#/businesstravel/hotel";
            }
            else if (sessionStorage.isHotel == 'false') {
                window.location.href = "#/businesstravel/createresult";
            }
        }
    }

    /*
     我要出差选择住宿
     * @param $scope
     * @constructor
     */
    businesstravel.HotelController = function($scope) {
        changeTitle('我要出差',$scope);
        loading(true);

        //遍历存储数据为undefined
        for (var i = 0, len = sessionStorage.length; i < len; i++) {
            var key = sessionStorage.key(i);
            var value = sessionStorage.getItem(key);
            if (value == "undefined") {
                sessionStorage.setItem(key,"");
            }
        }
        $scope.purposeName = sessionStorage.purposeName;
        $scope.isTraffic = sessionStorage.isTraffic;
        $scope.isHotel = sessionStorage.isHotel;
        if (sessionStorage.hotelCityName) {
            $scope.hotelCityName = sessionStorage.hotelCityName;
            $scope.hotelCityCode = sessionStorage.hotelCityCode;
            $scope.hotelPlaceName = sessionStorage.hotelPlaceName;
            $scope.hotelPlaceCode = sessionStorage.hotelPlaceCode;
            $scope.startHotelDate = sessionStorage.startHotelDate;
            $scope.endHotelDate = sessionStorage.endHotelDate;
        }
        else {
            if (sessionStorage.isTraffic == 'true') {
                $scope.hotelCityName = sessionStorage.endCityName;
                $scope.hotelCityCode = sessionStorage.endCityCode;
                $scope.startHotelDate = sessionStorage.startDate;
                $scope.endHotelDate = sessionStorage.endDate;
                $('#hotelCity').attr('code',$scope.hotelCityCode);
            }
            else if (sessionStorage.isTraffic == 'false') {
                $scope.hotelCityName = sessionStorage.hotelCityName;
                $scope.hotelCityCode = sessionStorage.hotelCityCode;
                $scope.hotelPlaceName = sessionStorage.hotelPlaceName;
                $scope.hotelPlaceCode = sessionStorage.hotelPlaceCode;
                $scope.startHotelDate = sessionStorage.startHotelDate;
                $scope.endHotelDate = sessionStorage.endHotelDate;
            }
        }
        console.info (sessionStorage);

        //选择住宿城市
        $scope.selectHotelCity = function () {
            API.onload(function() {
                API.place.hotCities({})
                    .then(function(result){
                        return selectPage({
                            defaultDataFunc: function() {
                                return new Promise(function(resolve) {
                                    resolve(result);
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
                    .spread(function(hotelCityCode, hotelCityName) {
                        $scope.hotelCityName = hotelCityName;
                        $scope.hotelCityCode = hotelCityCode;
                        $('#hotelCity').attr('code',$scope.hotelCityCode);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                    })
            })
        }

        //选择地标
        $scope.selectHotelName = function () {
            API.onload(function() {
                API.place.hotBusinessDistricts({code:$scope.hotelCityCode})
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
                                    resolve(API.place.queryBusinessDistrict({keyword:keyword,code:$scope.hotelCityCode}));
                                });
                            },
                            isAllowAdd: false,
                            showDefault: true,
                            displayNameKey: "name",
                            valueKey: "id",
                            title: '热门地标',
                            placeholder: '输入地标名称'
                        });
                    })
                    .spread(function(hotelPlaceCode, hotelPlaceName) {
                        $scope.hotelPlaceName = hotelPlaceName;
                        $scope.hotelPlaceCode = hotelPlaceCode;
                        $('#hotelName').attr('code',$scope.hotelPlaceCode);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                    })
            })
        }

        //选择入店日期
        $scope.chooeseStartData = function($event){
            calendar.selectDate({
                displayMonthNum: 12
            })
                .then(function(startHotelDate) {
                    $scope.startHotelDate = startHotelDate;
                    $scope.$apply();
                })
                .catch(function(err) {
                    console.error(err);
                })
        }

        //选择离店日期
        $scope.chooeseEndData = function($event, begintime){
            if(begintime){
                begintime = $scope.startHotelDate;
                if(! begintime.match(/\d{4}-\d{2}-\d{2}/))
                    begintime = undefined;
            }
            calendar.selectDate({
                accept_begin: begintime,
                selected: $event.target.value,
                displayMonthNum: 12
            })
                .then(function(endHotelDate) {
                    $scope.endHotelDate = endHotelDate;
                    $scope.$apply();
                })
                .catch(function(err) {
                    console.error(err);
                })
        }

        $scope.returnUrl = function () {
            if ($scope.isTraffic == 'true') {
                window.location.href = "#/businesstravel/traffic";
            }
            else if ($scope.isTraffic == 'false') {
                window.location.href = "#/businesstravel/index";
            }
        }

        $scope.nextStep = function () {
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            if ($scope.hotelCityName == "" || $scope.hotelCityName == undefined) {
                msgbox.log("请选择目的地城市");
                return false;
            }
            if (!$scope.startHotelDate || !dateReg.test($scope.startHotelDate)) {
                msgbox.log("入住日期不存在或格式不正确");
                return false;
            }
            if (!$scope.endHotelDate || !dateReg.test($scope.endHotelDate)) {
                msgbox.log("离店日期不存在或格式不正确");
                return false;
            }
            sessionStorage.hotelCityName = $scope.hotelCityName;
            sessionStorage.hotelCityCode = $scope.hotelCityCode;
            sessionStorage.hotelPlaceName = $scope.hotelPlaceName;
            sessionStorage.hotelPlaceCode = $scope.hotelPlaceCode;
            sessionStorage.startHotelDate = $scope.startHotelDate;
            sessionStorage.endHotelDate = $scope.endHotelDate;
            window.location.href = "#/businesstravel/createresult";
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

        //遍历存储数据为undefined
        for (var i = 0, len = sessionStorage.length; i < len; i++) {
            var key = sessionStorage.key(i);
            var value = sessionStorage.getItem(key);
            if (value == "undefined") {
                sessionStorage.setItem(key,"");
            }
        }
        $scope.purposeName = sessionStorage.purposeName;
        $scope.isTraffic = sessionStorage.isTraffic;
        $scope.isHotel = sessionStorage.isHotel;
        if ($scope.isTraffic == 'true') {
            $scope.isTraffic = true;
        }
        if ($scope.isHotel == 'true') {
            $scope.isHotel = true;
        }
        if ($scope.isTraffic == 'false') {
            $scope.isTraffic = false;
        }
        if ($scope.isHotel == 'false') {
            $scope.isHotel = false;
        }
        $scope.startCityName = sessionStorage.startCityName;
        $scope.startCityCode = sessionStorage.startCityCode;
        $scope.endCityName = sessionStorage.endCityName;
        $scope.endCityCode = sessionStorage.endCityCode;
        $scope.startDate = sessionStorage.startDate;
        $scope.endDate = sessionStorage.endDate;
        $scope.startTimeLate = sessionStorage.startTimeLate;
        $scope.endTimeLate = sessionStorage.endTimeLate;
        $scope.hotelCityName = sessionStorage.hotelCityName;
        $scope.hotelCityCode = sessionStorage.hotelCityCode;
        $scope.hotelPlaceName = sessionStorage.hotelPlaceName;
        $scope.hotelPlaceCode = sessionStorage.hotelPlaceCode;
        $scope.startHotelDate = sessionStorage.startHotelDate;
        $scope.endHotelDate = sessionStorage.endHotelDate;


        //只选交通
        if ($scope.isTraffic && !$scope.isHotel) {
            API.onload(function() {
                Q.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getTrafficBudget({
                        originPlace:$scope.startCityCode,
                        destinationPlace:$scope.endCityCode,
                        outboundDate:$scope.startDate,
                        inboundDate:$scope.endDate,
                        outLatestArriveTime:$scope.startTimeLate,
                        inLatestArriveTime:$scope.endTimeLate,
                        isRoundTrip:$scope.endDate
                    })
                ])
                    .spread(function(ret1,ret2) {
                        console.info (ret2);
                        $('.loading_result').hide();
                        msgbox.log("预算生成成功");
                        $scope.onlyTraffic = ret2;
                        $scope.totalPrice = ret2.price;
                        $scope.goTrafficPrice = ret2.goTraffic.price;
                        $scope.backTrafficPrice = ret2.backTraffic.price;
                        if (ret2.goTraffic.price == '-1') {
                            $scope.goTrafficType = 'TRAIN';
                        }
                        if (ret2.goTraffic.type && ret2.goTraffic.type == 'air') {
                            $scope.goTrafficType = 'PLANE';
                        }
                        if (ret2.goTraffic.type && ret2.goTraffic.type == 'train') {
                            $scope.goTrafficType = 'TRAIN';
                        }
                        if (ret2.backTraffic.price == '-1') {
                            $scope.backTrafficType = 'TRAIN';
                        }
                        if (ret2.backTraffic.type && ret2.backTraffic.type == 'air') {
                            $scope.backTrafficType = 'PLANE';
                        }
                        if (ret2.backTraffic.type && ret2.backTraffic.type == 'air') {
                            $scope.backTrafficType = 'TRAIN';
                        }
                        $scope.$apply();

                    })
                    .catch(function(err){
                        console.info (err);
                        window.location.href = "#/businesstravel/fail";
                    });
            })
        }

        //只选住宿
        if (!$scope.isTraffic && $scope.isHotel) {
            API.onload(function() {
                Q.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getHotelBudget({
                        cityId:$scope.hotelCityCode,
                        businessDistrict:$scope.hotelPlaceCode,
                        checkInDate: $scope.startHotelDate,
                        checkOutDate: $scope.endHotelDate
                    })
                ])
                    .spread(function(ret1,ret2) {
                        console.info (ret2);
                        $('.loading_result').hide();
                        msgbox.log("预算生成成功");
                        $scope.onlyHotel = ret2;
                        $scope.totalPrice = ret2.price;
                        $scope.hotelPrice = ret2.price;
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                        window.location.href = "#/businesstravel/fail";
                    });
            })
        }

        //选择交通和住宿
        if ($scope.isTraffic && $scope.isHotel) {
            API.onload(function() {
                Q.all([
                    API.staff.getCurrentStaff(),
                    API.travelBudget.getTravelPolicyBudget({
                        originPlace:$scope.startCityCode,
                        destinationPlace:$scope.endCityCode,
                        outboundDate:$scope.startDate,
                        inboundDate:$scope.endDate,
                        outLatestArriveTime:$scope.startTimeLate,
                        inLatestArriveTime:$scope.endTimeLate,
                        cityId:$scope.hotelCityCode,
                        businessDistrict:$scope.hotelPlaceCode,
                        checkInDate:$scope.startHotelDate,
                        checkOutDate:$scope.endHotelDate,
                        isRoundTrip:$scope.endDate
                    })
                ])
                    .spread(function(ret1,ret2) {
                        $('.loading_result').hide();
                        console.info(ret2);
                        $scope.trafficHotel = ret2;
                        $scope.totalPrice = ret2.price;
                        $scope.trafficPrice = ret2.traffic;
                        $scope.hotelPrice = ret2.hotel;
                        $scope.goTrafficPrice = ret2.goTraffic.price;
                        $scope.backTrafficPrice = ret2.backTraffic.price;
                        if (ret2.goTraffic.price == '-1') {
                            $scope.goTrafficType = 'TRAIN';
                        }
                        if (ret2.goTraffic.type && ret2.goTraffic.type == 'air') {
                            $scope.goTrafficType = 'PLANE';
                        }
                        if (ret2.goTraffic.type && ret2.goTraffic.type == 'train') {
                            $scope.goTrafficType = 'TRAIN';
                        }
                        if (ret2.backTraffic.price == '-1') {
                            $scope.backTrafficType = 'TRAIN';
                        }
                        if (ret2.backTraffic.type && ret2.backTraffic.type == 'air') {
                            $scope.backTrafficType = 'PLANE';
                        }
                        if (ret2.backTraffic.type && ret2.backTraffic.type == 'air') {
                            $scope.backTrafficType = 'TRAIN';
                        }
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
                    description:$scope.purposeName,
                    startPlace:$scope.startCityName,
                    startPlaceCode:$scope.startCityCode,
                    destination:$scope.endCityName,
                    destinationCode:$scope.endCityCode,
                    startAt:$scope.startDate,
                    startTime:$scope.startHotelDate,
                    endTime:$scope.endHotelDate,
                    budget:Number($scope.totalPrice),
                    isNeedTraffic:$scope.isTraffic,
                    isNeedHotel:$scope.isHotel,
                    remark:$scope.startCityName+$scope.endCityName+$scope.startDate+$scope.hotelPlaceName+$scope.startHotelDate
                }
                if ($scope.endDate) {
                    order.backAt = $scope.endDate;
                }
                if (!$scope.isTraffic && $scope.isHotel) {
                    order.startAt = $scope.startHotelDate;
                }

                //住宿
                if($scope.isHotel){
                    var consumeDetails_hotel = {
                        type:0,
                        city:$scope.hotelCityName,
                        cityCode:$scope.hotelCityCode,
                        hotelName:$scope.hotelPlaceName,
                        startTime:$scope.startHotelDate,
                        endTime:$scope.endHotelDate,
                        budget:Number($scope.hotelPrice),
                        invoiceType: 'HOTEL'
                    }
                    consumeDetails.push(consumeDetails_hotel);
                }

                //去程
                if($scope.startDate){
                    var consumeDetails_outTraffic = {
                        type:-1,
                        startPlace:$scope.startCityName,
                        startPlaceCode:$scope.startCityCode,
                        arrivalPlace:$scope.endCityName,
                        arrivalPlaceCode:$scope.endCityCode,
                        startTime:$scope.startDate,
                        budget:Number($scope.goTrafficPrice),
                        invoiceType:$scope.goTrafficType
                    }
                    if($scope.endDate){
                        consumeDetails_outTraffic.endTime = $scope.endDate;
                    }
                    if($scope.startTimeLate){
                        consumeDetails_outTraffic.latestArriveTime = $scope.startDate+' '+$scope.startTimeLate;
                    }
                    consumeDetails.push(consumeDetails_outTraffic);
                }
                //回程
                if($scope.endDate){
                    var consumeDetails_backTraffic = {
                        type:1,
                        startPlace:$scope.endCityName,
                        startPlaceCode:$scope.endCityCode,
                        arrivalPlace:$scope.startCityName,
                        arrivalPlaceCode:$scope.startCityCode,
                        startTime:$scope.endDate,
                        budget:Number($scope.backTrafficPrice),
                        invoiceType: $scope.backTrafficType
                    }
                    if($scope.endTimeLate){
                        consumeDetails_backTraffic.latestArriveTime = $scope.endDate+' '+$scope.endTimeLate;
                    }
                    consumeDetails.push(consumeDetails_backTraffic);
                }
                order.consumeDetails = consumeDetails;
                API.tripPlan.savePlanOrder(order)
                    .then(function(result){
                        console.info (result);
                        msgbox.log("已成功生成出差记录");
                        sessionStorage.clear();
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
        $scope.returnUrl = function () {
            window.location.href = "#/businesstravel/index";
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