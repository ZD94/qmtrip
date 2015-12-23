/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var businessTravel=(function(){

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
        $scope.NextStep = function (purposename) {
            if ($(".purposename").val()=="") {
                Myalert("温馨提示","请填写出差目的");
                return false;
            }
            if ($(".trafficimg").css('display')=='inline' && $(".liveimg").css('display')=='none'){
                $(".step1").hide();
                $(".traffic_step1").show();
            }
            if ($(".trafficimg").css('display')=='none' && $(".liveimg").css('display')=='inline') {
                $(".step1").hide();
                $(".live_step1").show();
            }
            if ($(".trafficimg").css('display')=='inline' && $(".liveimg").css('display')=='inline') {
                $(".step1").hide();
                $(".traffic_step1").show();
            }
        }

        /*
         我要出差选择交通start
         */

        //出发城市获取
        $scope.Tstartplace = function () {
            API.onload(function() {
                API.place.queryPlace($scope.Tstartplacename)
                    .then(function(result) {
                        $(".placelist1").show();
                        $scope.Tstartplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.TchooseStartplace = function (name,id) {
            $(".traffic1").val(name);
            $(".traffic1").attr("checkval",id);
            $(".placelist1").fadeOut(100);
        }

        //目的地城市获取
        $scope.Tendplace = function () {
            API.onload(function() {
                API.place.queryPlace($scope.Tendplacename)
                    .then(function(result) {
                        $(".placelist2").show();
                        $scope.Tendplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.TchooseEndplace = function (name,id) {
            $(".traffic2").val(name);
            $(".traffic2").attr("checkval",id);
            $(".placelist2").fadeOut(100);
        }


        $scope.TprevStep = function () {
            $(".step1").show();
            $(".traffic_step1").hide();
        }
        /*
         我要出差选择交通end
         */


        /*
         我要出差选择住宿
         */
        $scope.Lendplace = function () {
            API.onload(function() {
                API.place.queryPlace($scope.Lendplacename)
                    .then(function(result) {
                        $(".placelist1").show();
                        $scope.Lendplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.LchooseEndplace = function (name,id) {
            $(".live1").val(name);
            $(".live1").attr("checkval",id);
            $(".placelist1").fadeOut(100);
        }






        //生成预算
        $scope.budget = function () {
            var startplace = $(".a1").attr("checkval"),
                endplace = $(".a2").attr("checkval"),
                starttime = $("#start_time").val(),
                starttimelate = $("#start_timelate").val(),
                endtime = $("#end_time").val(),
                endtimelate = $("#end_timelate").val();
            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
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
            if (!dateReg.test(endtime)&&endtime!="") {
                Myalert("温馨提示","返程日期格式不正确");
                return false;
            }
            if (starttime>=endtime&&endtime!="") {
                Myalert("温馨提示","返程日期不能小于出发日期");
                return false;
            }
            if (startplace == endplace) {
                Myalert("温馨提示","出发城市与目的地城市不能相同");
                return false;
            }
            API.onload(function() {
                API.travelBudget.getTravelPolicyBudget({originPlace:startplace,destinationPlace:endplace,outboundDate:starttime,inboundDate:endtime})
                    .then(function(result) {
                        $(".step2").hide();
                        $(".step3").show();
                        $(".top").html("本次出差预算：¥"+result.price);
                        $(".asd3").html("出发地："+$(".a1").val()+"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;目的地："+$(".a2").val()+"<br>出发时间："+starttime);
                        $(".asd4").html("¥"+result.price);
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                        openL("温馨提示","生成失败，请重新生成");
                        $(".messagebox_close").click(function(){
                            location.reload();
                        });
                    });
            })
        }
    }


    return businessTravel;
})();

module.exports = businessTravel;