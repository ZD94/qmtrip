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

        $scope.TrafficUploader = new FileUploader(trafficUploadConfig);
        $scope.HotelUploader = new FileUploader(hotelUploadConfig);
        $scope.BackTrafficUploader = new FileUploader(backTrafficUploadConfig);

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