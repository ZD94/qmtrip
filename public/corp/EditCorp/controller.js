///**
// * Created by qp on 2016/1/22.
// */
//'use strict';
//var corp=(function(){
//    API.require('company');
//    API.require('auth');
//    API.require('checkcode');
//    API.require('staff');
//    var corp = {};
//
//    corp.EditcorpController = function($scope,$routeParams) {
//        //alert(222);
//        var companyid = $routeParams.companyId;
//        API.onload(function(){
//            API.company.getCompanyById(companyid)
//                .then(function(corpInfo){
//                    console.info(corpInfo);
//                    $scope.corpname = corpInfo.name;
//                    $scope.eamil = corpInfo.email;
//                    $scope.connectmobile = corpInfo.mobile;
//                    var createId = corpInfo.createUser;
//                    API.staff.getStaff({id:createId})
//                        .then(function(staff){
//                            console.info(staff);
//                            $scope.connectname = staff.staff.name;
//                        })
//                        .catch(function(err){
//                            console.error(err);
//                        })
//                }).catch(function(err){
//                    console.error(err);
//                }).done();
//        })
//
//        var imgW = $('#imgCode').attr("width");
//        var imgH = $('#imgCode').attr("height");
//        var msgTicket = "";//短信验证码凭证
//        var picTicket = "";//图片验证码凭证
//        API.onload(function(){
//            API.checkcode.getPicCheckCode({width:imgW,height:imgH,quality:100,length:4})
//                .then(function(result){
//                    $("#imgCode").attr("src",result.captcha);
//                    picTicket = result.ticket;
//                }).catch(function(err){
//                    console.info(err);
//                }).done();
//        })
//
//        //获取短信验证码
//        $scope.getMCode = function() {
//            //console.info(1111);
//            var mobile = $('#corpMobile').val();
//            if(!mobile){
//                $scope.err_msg_phone = "联系人电话不能为空";
//                //console.info(123333);
//                $("#corpMobile").siblings(".err_msg").children("i").html("&#xf06a;");
//                $("#corpMobile").siblings(".err_msg").children("i").removeClass("right");
//                $("#corpMobile").siblings(".err_msg").show();
//                $("#corpMobile").focus();
//                return false;
//            }
//            API.onload(function(){
//                API.checkcode.getMsgCheckCode({mobile:mobile})
//                    .then(function(result){
//                        console.info("获取到的结果是:");
//                        console.info(result);
//                        //console.info("获取验证码", result);
//                        msgTicket = result.ticket;
//
//                        var $seconds = $("#seconds");
//                        var $timer = $("#timer");
//                        var $btn = $(".v_code");
//                        //显示倒计时
//                        $btn.hide();
//                        $timer.show();
//
//                        var timer = setInterval(function() {
//                            var begin = $seconds.text();
//                            begin = parseInt(begin);
//                            if (begin <=0 ) {
//                                clearInterval(timer);
//                                $btn.show();
//                                $timer.hide();
//                                $seconds.text(90);
//                            } else {
//                                begin = begin - 1;
//                                $seconds.text(begin);
//                            }
//                        }, 1000);
//                    }).catch(function(err){
//                        if(err.msg) {
//                            alert(err.msg);
//                        }
//                        console.info(err);
//                    }).done();
//            })
//
//        }
//
//        //点击提交
//        $scope.commitInfo = function(){
//            var cName  = $('#corpName').val();
//            var name   = $('#corpRegistryName').val();
//            var mail   = $('#corpMail').val();
//            var mobile = $('#corpMobile').val();
//            var mCode = $('#msgCode').val();
//            var pCode = $('#picCode').val();
//            var commit = true;
//
//            if(commit){
//                if(!cName){
//                    $scope.err_msg = "企业名称不能为空";
//                    $("#corpName").siblings(".err_msg").children("i").html("&#xf06a;");
//                    $("#corpName").siblings(".err_msg").children("i").removeClass("right");
//                    $("#corpName").siblings(".err_msg").show();
//                    return false;
//                }else if(!name){
//                    $scope.err_msg_name = "联系人姓名不能为空";
//                    $("#corpRegistryName").siblings(".err_msg").children("i").html("&#xf06a;");
//                    $("#corpRegistryName").siblings(".err_msg").children("i").removeClass("right");
//                    $("#corpRegistryName").siblings(".err_msg").show();
//                    return false;
//                }else if(!mobile){
//                    $scope.err_msg_phone = "联系人电话不能为空";
//                    $("#corpMobile").siblings(".err_msg").children("i").html("&#xf06a;");
//                    $("#corpMobile").siblings(".err_msg").children("i").removeClass("right");
//                    $("#corpMobile").siblings(".err_msg").show();
//                    return false;
//                }else if(!mobile.match(/^[1][0-9]{10}$/)){
//                    $scope.err_msg_phone = "手机格式不正确";
//                    $("#corpMobile").siblings(".err_msg").children("i").html("&#xf057;");
//                    $("#corpMobile").siblings(".err_msg").children("i").removeClass("right");
//                    $("#corpMobile").siblings(".err_msg").show();
//                    //$("#corpMobile").focus();
//                    return false;
//                }else if(!mCode){
//                    $scope.err_msg_msg = "手机验证码不能为空";
//                    $("#msgCode").parent("div").siblings(".err_msg").children("i").html("&#xf06a;");
//                    $("#msgCode").parent("div").siblings(".err_msg").children("i").removeClass("right");
//                    $("#msgCode").parent("div").siblings(".err_msg").show();
//                    return false;
//                }else if(!pCode){
//                    $scope.err_msg_pic = "图片验证码不能为空";
//                    $("#picCode").parent("div").siblings(".err_msg").children("i").html("&#xf06a;");
//                    $("#picCode").parent("div").siblings(".err_msg").children("i").removeClass("right");
//                    $("#picCode").parent("div").siblings(".err_msg").show();
//                    return false;
//                }
//            }
//        }
//    }
//
//    return corp;
//})();
//
//module.exports = corp;