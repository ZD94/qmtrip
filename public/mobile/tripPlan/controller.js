/**
 * Created by chenhao on 2016/1/22.
 */
 'use strict';
 var tripPlan =(function(){
 	API.require("staff");
 	API.require("tripPlan");
 	API.require("wechat");
 	var tripPlan ={};

 	tripPlan.UploadImgController = function($scope, $stateParams, FileUploader){
        function isWeixin() {
            var reg  = /micromessenger/i;
            return reg.test(window.navigator.userAgent);
        }

        $scope.winWidth = $(window).width();
        $scope.uploader = init_uploader(FileUploader);
        $scope.backtraffic_up = function(cb){
            var type1='交通';
            var type2 = '回程';
            cb(type1, type2);
        }
        $scope.backtraffic_done = function(response){
            var fileId = response.fileId;
            uploadInvoice($scope.backTraffic.id, fileId, function(err, result){
                    if (err ) {
                        TLDAlert(err.msg || err);
                        return;
                    }
                    $scope.initall();
                });
        }
        function uploadInvoice(consumeId, picture, callback) {
            API.tripPlan.uploadInvoice({
                    consumeId: consumeId,
                    picture: picture
                }, callback);
        }
 		var planId = $stateParams.planId;
        $scope.initall = function() {
            API.onload(function(){
                API.tripPlan.getTripPlanOrderById({orderId: planId})
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
                        API.staff.getCurrentStaff()
                            .then(function(staff){
                                $scope.name = staff.name;
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
        
 	}
    tripPlan.UploadDownController = function($scope){
    }
 	return tripPlan;
 })();
 module.exports = tripPlan;