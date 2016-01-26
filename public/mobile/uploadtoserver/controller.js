/**
 * Created by chenhao on 2016/1/22.
 */
 'use strict';
 var uploadtoserver =(function(){
 	API.require("staff");
 	API.require("tripPlan");
 	API.require("wechat");
 	var uploadtoserver ={};

 	uploadtoserver.UploadImgController = function($scope, $routeParams){
 		loading(true);
 		var planId = $routeParams.planId;
 		API.onload(function(){
 			API.tripPlan.getTripPlanOrderById(planId)
 				.then(function(plan){
 					console.info(plan);
 					$scope.plan = plan;
 					$scope.backTraffic = plan.backTraffic[0];
                    $scope.hotel = plan.hotel[0];
                    $scope.outTraffic = plan.outTraffic[0];
                    API.staff.getCurrentStaff()
                    	.then(function(staff){
                    		$scope.name = staff.name;
                    		$scope.$apply();
                    	})
                    $(".file").AjaxFileUpload({
                        action: '/upload/ajax-upload-file?type=invoice',
                        onComplete: function(filename, response) {
                            $scope.ref = $(this).attr("ref");
                            $scope.md5 = response.md5key;
                            $scope.$apply();
                            console.info(filename);
                            if (response.ret == 0 ) {
                                var ImgSrc = '/upload/get-img-file/'+response.md5key;
                                var invoiceType = "";
                                if ($(this).attr("data-type") == 1) {
                                    invoiceType = "去程交通票据";
                                }else if ($(this).attr("data-type") == 2) {
                                    invoiceType = "住宿票据";
                                }
                                else if ($(this).attr("data-type") == 3) {
                                    invoiceType = "返程交通票据";
                                }
                                $(".messagebox_content img").attr("src",ImgSrc);
                                $(".messagebtns em").html(invoiceType);
                                $("#uploadimg").show();
                                position();
                            } else {
                              console.info(response.errMsg);
                              console.info("#############");
                            }
                        }
                    });
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
 	return uploadtoserver;
 })();
 module.exports = uploadtoserver;