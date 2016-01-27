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
        //                console.info(err);
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
                autoUpload: true
            };

            var trafficUploadConfig = JSON.parse(JSON.stringify(uploadConf));
            trafficUploadConfig.onCompleteItem= function (item, resp) {
                uploadInvoice($scope.outTraffic.id, resp.md5key);
            }

            var hotelUploadConfig = JSON.parse(JSON.stringify(uploadConf));
            hotelUploadConfig.onCompleteItem = function(item, resp) {
                uploadInvoice($scope.hotel.id, resp.md5key);
            }

            var backTrafficUploadConfig = JSON.parse(JSON.stringify(uploadConf));
            backTrafficUploadConfig.onCompleteItem = function(item, resp) {
                uploadInvoice($scope.backTraffic.id, resp.md5key);
            }

            $scope.TrafficUploader = new FileUploader(trafficUploadConfig);
            $scope.HotelUploader = new FileUploader(hotelUploadConfig);
            $scope.BackTrafficUploader = new FileUploader(backTrafficUploadConfig);
        //}

        function uploadInvoice(consumeId, picture) {
            API.tripPlan.uploadInvoice({
                    consumeId: consumeId,
                    picture: picture
                })
                .then(function() {
                    alert("上传成功");
                    window.location.reload();
                    //var ImgSrc = '/upload/get-img-file/'+resp.md5key;
                    //$(".messagebox_content img").attr("src",ImgSrc);
                    //$(".messagebtns em").html('去程交通票据');
                    //$("#uploadimg").show();
                })
                .catch(function(err) {
                    alert(err.msg);
                })
        }

 		loading(true);
 		var planId = $routeParams.planId;
 		API.onload(function(){
 			API.tripPlan.getTripPlanOrderById(planId)
 				.then(function(plan){
 					$scope.plan = plan;
 					$scope.backTraffic = plan.backTraffic[0];
                    $scope.hotel = plan.hotel[0];
                    $scope.outTraffic = plan.outTraffic[0];
                    API.staff.getCurrentStaff()
                    	.then(function(staff){
                    		$scope.name = staff.name;
                    		$scope.$apply();
                    	})
 				})
 		})
		$scope.push = function () {
            API.onload(function() {
                API.tripPlan.commitTripPlanOrder(planId)
                    .then(function(result){
                        alert ("提交成功");
                    })
                    .catch(function(err){
                        alert (err.msg);
                    })
            })
        }
 	}
 	return tripPlan;
 })();
 module.exports = tripPlan;