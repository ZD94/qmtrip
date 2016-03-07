/**
 * Created by chenhao on 2016/1/22.
 */
 'use strict';
 var tripPlan =(function(){
 	API.require("staff");
 	API.require("tripPlan");
 	API.require("wechat");
 	var tripPlan ={};

 	tripPlan.UploadImgController = function($scope, $routeParams, FileUploader){
        function isWeixin() {
            var reg  = /micromessenger/i;
            return reg.test(window.navigator.userAgent);
        }

        $scope.isInWeixin = false;
        //if (isWeixin()) {
        //    //如果在微信中,调用微信jsdk
        //    $scope.isInWeixin = true;
        //    var url = window.location.href;
        //    var debug = true;
        //    var jsApiList = [
        //        "chooseImage",
        //        "uploadImage",
        //        "downloadImage"
        //    ];
        //
        //    API.onload(function() {
        //        API.wechat.getJSDKParams({
        //                url: url,
        //                debug: debug,
        //                jsApiList: jsApiList
        //            })
        //            .then(function(config) {
        //                wx.config(config);
        //            })
        //            .catch(function(err) {
        //                alert("系统错误,请稍后重试");
        //            });
        //    })
        //
        //    $scope.TrafficUploader = new FileUploader();    //不初始化报错
        //    $scope.HotelUploader = new FileUploader();
        //    $scope.BackTrafficUploader = new FileUploader();
        //
        //    $scope.uploadInvoice = function(id) {
        //        wx.ready(function() {
        //            wx.chooseImage({
        //                count: 1,
        //                success: function (res) {
        //                    var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
        //                    //上传
        //                    wx.uploadImage({
        //                        localId: localIds[0],
        //                        success: function(res) {
        //                            var serverId = res.serverId;
        //                            API.wechat.mediaId2key({
        //                                mediaId: serverId
        //                            })
        //                            .then(function(key) {
        //                                uploadInvoice(id, key);
        //                            })
        //                            .catch(function(err) {
        //                                console.info(err);
        //                                alert("系统错误,请稍后重试");
        //                            })
        //                        }
        //                    })
        //                }
        //            })
        //        });
        //    }
        //
        //
        //} else {
            var uploadConf = {
                url: "/upload/ajax-upload-file?type=invoice",
                alias: "tmpFile",
                autoUpload: false
            };

            // function clone(obj) {
            //     return JSON.parse(JSON.stringify(obj));
            // }

            // var trafficUploadConfig = clone(uploadConf);
            // var hotelUploadConfig = JSON.parse(JSON.stringify(uploadConf));
            // $scope.TrafficUploader = new FileUploader(trafficUploadConfig);
            // $scope.HotelUploader = new FileUploader(hotelUploadConfig);
            // $scope.BackTrafficUploader = new FileUploader(backTrafficUploadConfig);
            var uploader = $scope.uploader = new FileUploader(uploadConf);
            uploader.filters.push({
                name: 'customFilter',
                fn: function(item /*{File|FileLikeObject}*/, options) {
                    return this.queue.length < 10;
                }
            });
            uploader.onAfterAddingFile = function(file) {
                preview(file);
                // initUpload(TLD);
                console.info(uploader.queue[0]._file);
                console.info("##############")
                // console.info(file);
            }
            uploader.onProgressItem = function(fileItem, progress) {
                console.info('onProgressItem', fileItem, progress);
            };
            // trafficUploadConfig.onCompleteItem= function (item, resp) {
            //     $(".upload_sure span strong").html("交通票据");
            //     $(".upload_sure span em").html("去程");
            //     $scope.type = 'outTraffic';
            //     $scope.consumeId = $scope.outTraffic.id;
            //     $scope.md5key = resp.md5key;
            //     $scope.$apply();
            //     preview(resp.md5key);
            // }

            function preview(key) {
                    // $(".upload_sure").find("img").remove();
                    // var img = "<img src="+'/self/attachments/'+key+">";
                    // $(".upload_sure").append(img);
                    $(".upload_sure").show();
            }

            $scope.previewOk = function() {
                uploadInvoice($scope.consumeId, $scope.md5key, function(err, result){
                    console.info(err)
                    console.info(result)
                    if (err ) {
                        TLDAlert(err.msg || err);
                        return;
                    }
                    $scope.initall();
                    $scope.close_pre();
                });
            }
            

            // hotelUploadConfig.onCompleteItem = function(item, resp) {
            //     $(".upload_sure span strong").html("酒店发票");
            //     $scope.type = 'hotel';
            //     $scope.consumeId = $scope.hotel.id;
            //     $scope.md5key = resp.md5key;
            //     $scope.$apply();
            //     preview(resp.md5key);
            // }

            // var backTrafficUploadConfig = JSON.parse(JSON.stringify(uploadConf));
            // backTrafficUploadConfig.onCompleteItem = function(item, resp) {
            //     $(".upload_sure span strong").html("交通票据");
            //     $(".upload_sure span em").html("回程");
            //     $scope.type = 'backTraffic';
            //     $scope.consumeId = $scope.backTraffic.id;
            //     $scope.md5key = resp.md5key;
            //     $scope.$apply();
            //     preview(resp.md5key);
            // }

            // trafficUploadConfig.onBeforeUpload = function(){
            //     $(".upload_sure").find("img").remove();
            //     console.info("onBeforeUpload");
            //     var img = "<img src="+'/images/data-loading.gif'+">";
            //     $(".upload_sure").append(img);
            //     $(".upload_sure").show();
            // }
            // hotelUploadConfig.onBeforeUpload = function(){
            //     console.info("onBeforeUpload");
            //     $(".upload_sure").find("img").remove();
            //     var img = "<img src="+'/images/data-loading.gif'+">";
            //     $(".upload_sure").append(img);
            //     $(".upload_sure").show();
            // }
            // backTrafficUploadConfig.onBeforeUpload = function(){
            //     console.info("onBeforeUpload");
            //     $(".upload_sure").find("img").remove();
            //     var img = "<img src="+'/images/data-loading.gif'+">";
            //     $(".upload_sure").append(img);
            //     $(".upload_sure").show();
            // }
            // $scope.TrafficUploader = new FileUploader(trafficUploadConfig);
            // $scope.HotelUploader = new FileUploader(hotelUploadConfig);
            // $scope.BackTrafficUploader = new FileUploader(backTrafficUploadConfig);
        //}

        function uploadInvoice(consumeId, picture, callback) {
            API.tripPlan.uploadInvoice({
                    consumeId: consumeId,
                    picture: picture
                })
                .then(function(ret) {
                    callback();
                })
                .catch(function(err) {
                    alert(err.msg);
                })
        }

 		loading(true);
 		var planId = $routeParams.planId;
        $scope.initall = function() {
            API.onload(function(){
                API.tripPlan.getTripPlanOrderById(planId)
                    .then(function(plan){
                        $scope.plan = plan;
                        $scope.backTraffic = plan.backTraffic[0];
                        $scope.hotel = plan.hotel[0];
                        $scope.outTraffic = plan.outTraffic[0];
                        var backTraffic = plan.backTraffic[0];
                        var hotel = plan.hotel[0];
                        var outTraffic = plan.outTraffic[0];
                        if(plan.outTraffic.length!=0) {
                            if(outTraffic.invoice.length==0){
                                $scope.outClass = "unupload";
                            }else if(outTraffic.invoice.length!=0 && outTraffic.status =='0'){
                                $scope.outClass = "imgdown";
                            }else if(outTraffic.invoice.length!=0 && outTraffic.status=='-1'){
                                $scope.outClass = "fail";
                            }else if(outTraffic.invoice.length!=0 && outTraffic.status=='1'){
                                $scope.outClass = "ready";
                            }
                        }
                        if (plan.hotel.length!=0) {
                            if(hotel.invoice.length==0){
                                $scope.hotelClass = "unupload";
                            }else if(hotel.invoice.length!=0 && hotel.status =='0'){
                                $scope.hotelClass = "imgdown";
                            }else if(hotel.invoice.length!=0 && hotel.status=='-1'){
                                $scope.hotelClass = "fail";
                            }else if(hotel.invoice.length!=0 && hotel.status=='1'){
                                $scope.hotelClass = "ready";
                            }
                        }
                        if(plan.backTraffic.length!=0){
                            if(backTraffic.invoice.length==0){
                                $scope.backClass = "unupload";
                            }else if(backTraffic.invoice.length!=0 && backTraffic.status =='0'){
                                $scope.backClass = "imgdown";
                            }else if(backTraffic.invoice.length!=0 && backTraffic.status=='-1'){
                                $scope.backClass = "fail";
                            }else if(backTraffic.invoice.length!=0 && backTraffic.status=='1'){
                                $scope.backClass = "ready";
                            }
                        }
                        console.info(plan);
                        // $scope.$apply();
                        API.staff.getCurrentStaff()
                            .then(function(staff){
                                $scope.name = staff.name;
                                $scope.$apply();
                            })
                    })
            })
        }
 		$scope.initall();
		$scope.push = function () {
            API.onload(function() {
                API.tripPlan.commitTripPlanOrder(planId)
                    .then(function(result){
                        alert ("提交成功");
                        window.location.href = '#/tripPlan/uploadDown';
                    })
                    .catch(function(err){
                        alert (err.msg);
                    })
            })
        }
        $scope.close_pre = function() {
            $(".upload_sure").hide();
        }
 	}
 	return tripPlan;
 })();
 module.exports = tripPlan;