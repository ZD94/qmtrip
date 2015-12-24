
'use strict';
var staff = (function(){

    API.require('staff');
    API.require('travelPolicy');
    var  staff = {};


    staff.StaffInfoManageController = function($scope){

        $scope.addStaff = function() {//添加员工信息
            $("#add").addClass("onCheck");
            $(".add_staff").show();
        }
        $scope.cancelAdd = function() {//取消添加
            $(".add_staff").hide();
            $("#add").removeClass("onCheck");
        }
        //对差旅标准进行初始化
        $scope.selectkey = "";//设置初始化显示
        $scope.selectClass = [
            {val:"",name:"请选择对应的差旅等级"}
        ]
        API.onload(function(){
            //console.info("API.onload");
            API.staff.getCurrentStaff()//qh获取当前登录人员的企业id
                .then(function(result){
                    $scope.companyId = result.staff.companyId;
                    //console.info($scope.companyId);
                    return $scope.companyId;
                })
                .catch(function(err){
                    //console.info("error");
                    console.info(err);
                })
            API.travelPolicy.getAllTravelPolicy({columns:name})//获取当前所有的差旅标准名称
                .then(function(result){
                    //console.info(result.travelPolicies);
                    var arr = result.travelPolicies;
                    var i ;
                    for(i=0; i<arr.length; i++){
                        var name = arr[i].name;
                        //console.info(name);
                        var id = arr[i].id;
                        $scope.selectClass.push({val:id,name:name});//放入option中
                        //console.info(id);
                    }

                })
                .catch(function(err){
                    //console.info("error");
                    console.info(err);
                })
        })
        $scope.saveStaffInfo = function() {
            var name = $("#staffName").val();
            var mail = $("#staffEmail").val();
            var tel  = $("#staffTel").val();
            var department = $("#staffDepartment").val();
            var n = $("#staffStandard").val().length;//获取差旅标准id的长度
            var standard   = $("#staffStandard").val().substr(7,n);
            var power      = $("#staffPower").val();
            var commit = true;

            if(commit){
                if(!name){
                    //alert("姓名是必填项！");
                    $scope.block_tip_err = "姓名是必填项！";
                    $(".block_tip").show();
                }else if(!mail){
                    $scope.block_tip_err = "邮箱是必填项！";
                    $(".block_tip").show();
                }else if(!tel){
                    //alert("手机号是必填项！");
                    $scope.block_tip_err = "手机号是必填项！";
                    $(".block_tip").show();
                }else if(!power){
                    //alert("权限是必选项！");
                    $scope.block_tip_err = "权限是必选项！";
                    $(".block_tip").show();
                }
                alert(standard);
                API.onload(function() {
                    API.staff.createStaff({name:name,mobile:tel,email:mail,companyId:$scope.companyId,department:department,travelLevel:standard,roleId:power})
                        .then(function(result){
                            console.info(result);
                            $scope.$apply();
                        }).catch(function (err) {
                            console.info(err);
                        }).done();
                })
            }
        }
    }
    return staff;
})();
module.exports = staff;