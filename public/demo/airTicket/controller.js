/**
 * Created by wyl on 15-11-20.
 */
'use strict';
module.exports =(function(){

    API.require("place");
    API.require("travelPolicy");
    API.require("auth")
    API.require("tripPlan")
    API.require("travelBudget")

    var airTicket = {};
    airTicket.IndexController = function ($scope) {
        //出发城市获取
        $scope.startplace = function () {
            API.onload(function() {
                API.place.queryPlace($scope.startplacename)
                    .then(function(result) {
                        $(".placelist1").show();
                        $(".remen1").hide();
                        $scope.startplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.asd1 = function (name,id) {
            $(".a1").val(name);
            $(".a1").attr("checkval",id);
            $(".placelist1").fadeOut(200);
        }
        $(".remen1 dd").click(function(){
            var value = $(this).html();
            var checkval = $(this).attr("checkval");
            $(".a1").val(value);
            $(".a1").attr("checkval",checkval);
            $(".remen1").fadeOut(200);
        });
        //获取焦点
        $(".a1").focus(function(){
            $(".remen1").fadeIn(200);
        });
        //失去焦点
        $(".a1").blur(function(){
            $(".remen1").fadeOut(200);
            $(".placelist1").fadeOut(200);
        });






        //目的地城市获取
        $scope.endplace = function () {
            API.onload(function() {
                API.place.queryPlace($scope.endplacename)
                    .then(function(result) {
                        $(".placelist2").show();
                        $(".remen2").hide();
                        $scope.endplaceitems = result;
                        console.info (result);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            })
        }
        $scope.asd2 = function (name,id) {
            $(".a2").val(name);
            $(".a2").attr("checkval",id);
            $(".placelist2").fadeOut(200);
        }
        $(".remen2 dd").click(function(){
            var value = $(this).html();
            var checkval = $(this).attr("checkval");
            $(".a2").val(value);
            $(".a2").attr("checkval",checkval);
            $(".remen2").fadeOut(200);
        });
        //获取焦点
        $(".a2").focus(function(){
            $(".remen2").fadeIn(200);
        });
        //失去焦点
        $(".a2").blur(function(){
            $(".remen2").fadeOut(200);
            $(".placelist2").fadeOut(200);
        });

        $(".btn").click(function(){
            var startplace = $(".a1").attr("checkval"),
                endplace = $(".a2").attr("checkval"),
                starttime = $("#start_time").val(),
                starttimelate = $("#start_timelate").val(),
                endtime = $("#end_time").val(),
                endtimelate = $("#end_timelate").val();

            var dateReg = /^\d{4}-\d{2}-\d{2}$/;
            if (startplace == "") {
                openL("温馨提示","请选择出发城市");
                return false;
            }
            if (endplace == "") {
                openL("温馨提示","请选择目的地城市");
                return false;
            }
            if (!starttime || !dateReg.test(starttime)) {
                openL("温馨提示","出发时间不存在或者格式不正确");
                return false;
            }
            if (!dateReg.test(endtime)) {
                openL("温馨提示","返程时间格式不正确");
                return false;
            }
            if (starttime>=endtime) {
                openL("温馨提示","返程时间不能小于出发时间");
                return false;
            }
            if (startplace == endplace) {
                openL("温馨提示","出发城市与目的地城市不能相同");
                return false;
            }
            $(".step1").hide();
            $(".step2").show();
            $(".asd1").html("您计划："+ starttime+"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+$(".a1").val()+"-"+$(".a2").val());
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
        })

    }
    return airTicket;
})();
