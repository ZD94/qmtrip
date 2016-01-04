
'use strict';
var staff = (function(){

    API.require('staff');
    API.require('travelPolicy');
    var  staff = {};

    //员工管理界面
    staff.StaffInfoManageController = function($scope){

        $(".left_nav li").removeClass("on").eq(2).addClass("on");
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

        //初始化员工记录的方法
        $scope.initStaff = function() {
            API.onload(function(){
                API.staff.getCurrentStaff()//获取当前登录人员的企业id
                    .then(function(staff){
                        API.staff.listAndPaginateStaff({companyId:staff.companyId})
                            .then(function(staffinfo){
                                //console.info(staffinfo);
                                $scope.staffs = staffinfo.items;
                                //console.info($scope.staff);
                                var tasks = $scope.staffs
                                    .map(function($staff){ //通过id拿到差旅标准的名字
                                        return API.travelPolicy.getTravelPolicy({id:$staff.travelLevel})
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
                            }).catch(function(err){
                                console.info(err);
                            })
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        //初始化所有的记录
        $scope.initstafflist = function(){
            //加载多个API方法
            API.onload(function(){
                console.log(123);

                API.staff.getCurrentStaff()//qh获取当前登录人员的企业id
                    .then(function(staff){
                        //console.log(Q);
                        return Q.all([
                            API.travelPolicy.getAllTravelPolicy({where: {companyId:staff.companyId}}),//获取当前所有的差旅标准名称
                            API.staff.listAndPaginateStaff({companyId:staff.companyId})//加载所有的员工记录
                        ])
                            .spread(function(travelPolicies,staffinfo){
                                console.log(456);
                                $scope.companyId = staff.companyId;
                                var arr = travelPolicies;
                                var i ;
                                for(i=0; i<arr.length; i++){
                                    var name = arr[i].name;
                                    var id = arr[i].id;
                                    $scope.selectClass.push({val:id,name:name});//放入option中
                                    //console.info(id);

                                }
                                $scope.staffs = staffinfo.items;
                                //console.info($scope.staff);
                                var tasks = $scope.staffs
                                    .map(function($staff){ //通过id拿到差旅标准的名字
                                        return API.travelPolicy.getTravelPolicy({id:$staff.travelLevel})
                                            .then(function(travelLevel){
                                                $staff.travelLeverName = travelLevel.name;//将相应的名字赋给页面中的travelLevelName
                                                $scope.$apply();
                                            })
                                    });
                                return Q.all(tasks)
                                    .then(function(){
                                        //console.log(6768);
                                        $scope.$apply();
                                    })
                                $scope.$apply();
                            })
                    })
                    .catch(function(err){
                        console.log(123456);
                        console.info(err);
                    })



            })
        }


        $scope.initstafflist();

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
                            $("#add").removeClass("onCheck");
                            //$scope.initstafflist();
                            $scope.initStaff();
                            $scope.$apply();
                        }).catch(function (err) {
                            $scope.block_tip_err = err.msg;
                            $(".block_tip").show();
                            $scope.$apply();
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
                        //$scope.initstafflist();
                        $scope.initStaff();
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
            //console.log(index);
            API.onload(function(){
                API.staff.deleteStaff({id:id})
                    .then(function(newStaff){
                        //console.info(456);
                        $scope.staffs.splice(index, 1);
                        //$scope.initstafflist();
                        $scope.$apply();
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        //批量添加员工
        $scope.addALotStaff = function(){
            $(".staff_tab_content").hide();
            $(".staff_tab_import").show();
            $(".staff_tab_valid").hide();
            $(".staff_import_success").hide();
            //alert(123);
        }

        //从批量添加返回到员工管理页面
        $scope.backToAddStaff = function(){
            $(".staff_tab_content").show();
            $(".staff_tab_import").hide();
            $(".staff_tab_valid").hide();
            $(".staff_import_success").hide();
            $scope.initStaff();
        }

        //上传文件进入预览页
        $scope.uploadStaffFile = function(){
            $(".staff_tab_valid").show();
            $(".staff_tab_content").hide();
            $(".staff_tab_import").hide();
            $(".staff_import_success").hide();
            var md5key = $("#fileMd5key").val();
            API.onload(function(){
                API.staff.getCurrentStaff()//获取当前登录人员的id
                    .then(function(staffid){
                        //console.info(staffid);
                        //console.info(staffid.id);
                        //console.info(md5key);
                        API.staff.beforeImportExcel({accountId:staffid.id,md5key:md5key})
                            .then(function(allData){
                                //console.info(allData);
                                //console.info(allData.noAddObj);
                                $scope.invalid = JSON.parse(allData.noAddObj);
                                $scope.valid = JSON.parse(allData.addObj);
                                $scope.downloadInvalidData = allData.downloadNoAddObj;
                                $scope.downloadValidData = allData.downloadAddObj;
                                $scope.validData = JSON.parse(allData.addObj).length;
                                $scope.invalidData = JSON.parse(allData.noAddObj).length;
                                //$scope.totalData =
                                //return $scope.valid;
                                $scope.$apply();
                            })
                            .catch(function(err){
                                console.info(err);
                            })
                    })
                    .catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        //从预览界面返回至员工批量导入
        $scope.backToImport = function(){
            $(".staff_tab_valid").hide();
            $(".staff_tab_content").hide();
            $(".staff_import_success").hide();
            $(".staff_tab_import").show();
        }

        //下载无效数据列表
        $scope.downloadExcleData = function(type){
            API.onload(function(){
                API.staff.getCurrentStaff()//获取当前登录人员的id
                    .then(function(staffid){
                        var objAttr = $scope.downloadInvalidData;
                        if(type == "valid"){
                            objAttr = $scope.downloadValidData;
                        }
                        API.staff.downloadExcle({accountId:staffid.id,objAttr:objAttr})
                            .then(function(invalidData){
                                console.info(invalidData);
                                var filename = invalidData.fileName;
                                window.open('/download/excle-file/'+filename, "_blank");
                                $scope.$apply();
                            }).catch(function(err){
                                console.info(err);
                            })
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        //确定导入数据
        $scope.importData = function(){
            //console.log($scope.valid);
            API.onload(function(){
                API.staff.importExcelAction({addObj:$scope.valid})
                    .then(function(data){
                        //console.info(data.addObj);
                        //console.info(data.noAddObj);
                        $(".staff_import_success").show();
                        $(".staff_tab_valid").hide();
                        $(".staff_tab_content").hide();
                        $(".staff_tab_import").hide();
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