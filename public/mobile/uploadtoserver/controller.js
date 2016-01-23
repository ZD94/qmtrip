/**
 * Created by chenhao on 2016/1/22.
 */
 'use strict';
 var uploadtoserver =(function(){
 	API.require("staff");
 	API.require("tripPlan");
 	var uploadtoserver ={};

 	uploadtoserver.UplaodImgController = function($scope){
 		loading(true);
 		alert(111);
 	}
 	return uploadtoserver;
 })();
 module.exports = uploadtoserver;