
'use strict';
var staff = (function(){

    API.require('staff');
    API.require('travelPolicy');
    var  staff = {};

    //员工管理界面
    staff.StaffInfoManageController = function($scope){

        //添加员工信息
        $scope.addStaff = function() {
            $("#add").addClass("onCheck");
            $(".add_staff").show();
        }
        //取消添加
        $scope.cancelAdd = function() {
            $(".add_staff").hide();
            $("#add").removeClass("onCheck");
        }

        //对差旅标准进行初始化
        $scope.selectkey = "";//设置初始化显示
        $scope.selectClass = [
            {val:"",name:"请选择对应的差旅等级"}
        ]

        //加载多个API方法
        API.onload(function(){
            //console.log(123);
            API.staff.getCurrentStaff()//qh获取当前登录人员的企业id
                .then(function(staff){
                    Q.all([
                        API.travelPolicy.getAllTravelPolicy({columns:name}),//获取当前所有的差旅标准名称
                        API.staff.listAndPaginateStaff({companyId:$scope.companyId}),//加载所有的员工记录
                    ])
                        .spread(function(travelPolicies,staffinfo){
                            //console.log(staffinfo);
                            //console.info(staffinfo);
                            $scope.companyId = staff.companyId;
                            var arr = travelPolicies;
                            var i ;
                            for(i=0; i<arr.length; i++){
                                var name = arr[i].name;
                                //console.info(name);
                                var id = arr[i].id;
                                $scope.selectClass.push({val:id,name:name});//放入option中
                                //console.info(id);

                            }
                            $scope.staffs = staffinfo.items;
                            //console.info($scope.staff);
                            var tasks = $scope.staffs
                                .map(function($staff){ //通过id拿到差旅标准的名字
                                    return API.travelPolicy.getTravelPolicy($staff.travelLevel)
                                        .then(function(travelLevel){
                                            $staff.travelLeverName = travelLevel.name;//将相应的名字赋给页面中的travelLevelName
                                            $scope.$apply();
                                        })
                                });
                            Q.all(tasks)
                                .then(function(){
                                    //console.log(6768);
                                    $scope.$apply();
                                })
                            $scope.$apply();
                        })
                })
                .catch(function(err){
                    console.info(err);
                })



        })

        //对员工信息进行保存的操作
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
                    $scope.block_tip_err = "姓名是必填项！";
                    $(".block_tip").show();
                }else if(!mail){
                    $scope.block_tip_err = "邮箱是必填项！";
                    $(".block_tip").show();
                }else if(!tel){
                    $scope.block_tip_err = "手机号是必填项！";
                    $(".block_tip").show();
                }else if(!power){
                    $scope.block_tip_err = "权限是必选项！";
                    $(".block_tip").show();
                }
                API.onload(function() {//创建员工
                    API.staff.createStaff({name:name,mobile:tel,email:mail,companyId:$scope.companyId,department:department,travelLevel:standard,roleId:power})
                        .then(function(staffinfo){
                            $(".add_staff").hide();
                            $scope.$apply();
                        }).catch(function (err) {
                            console.info(err);
                        }).done();
                })
            }
        }


        //对员工的信息进行修改
        $scope.editStaffInfo = function(index) {
            API.onload(function(){
                API.staff.listAndPaginateStaff({companyId:$scope.companyId})
                    .then(function(staffinfo){
                        $scope.travellevel = staffinfo.items[index].travelLevel;
                        //console.info ($scope.travellevel); 
                        $scope.selectkey = $scope.travellevel;
                        $scope.$apply();
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        //对员工所修改的信息进行保存
        $scope.updateStaffInfo = function(id,index){
            //alert(id);
            var name = $("#staffName"+index).val();
            var mail = $("#staffEmail"+index).val();
            var tel  = $("#staffTel"+index).val();
            var department = $("#staffDepartment"+index).val();
            var n = $("#staffStandard"+index).val().length;//获取差旅标准id的长度
            var standard   = $("#staffStandard"+index).val().substr(7,n);
            var power      = $("#staffPower"+index).val();
            var commit = true;

            API.onload(function(){
                API.staff.updateStaff({id: id, name:name,mobile:tel,email:mail,department:department,travelLevel:standard,roleId:power})
                    .then(function(newStaff){
                        $(".add_staff2").hide();
                        $scope.$apply();
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        //取消对员工信息的修改
        $scope.cancelAddStaffInfo = function(){
            $(".add_staff2").hide();
        }

        //删除员工的信息
        $scope.delStaffInfo = function(id, index) {
            console.log(index);
            API.onload(function(){
                API.staff.deleteStaff({id:id})
                    .then(function(newStaff){
                        console.info(456);
                        $scope.staffs.splice(index, 1);
                        $scope.$apply();
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

    }

    return staff;
})();
module.exports = staff;