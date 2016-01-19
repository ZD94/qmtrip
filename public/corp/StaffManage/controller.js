
'use strict';
var staff = (function(){

    API.require('staff');
    API.require('travelPolicy');
    API.require('auth');
    var  staff = {};

    //员工管理界面
    staff.StaffInfoManageController = function($scope){

        $(".left_nav li").removeClass("on").eq(1).addClass("on");
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
        $scope.department = "";

        //初始化所有的记录
        $scope.initstafflist = function(){
            //加载多个API方法
            API.onload(function(){
                API.staff.getCurrentStaff()//qh获取当前登录人员的企业id
                    .then(function(staff){
                        $scope.roleId = staff.roleId;
                        $scope.currentStaff = staff;
                        var params = {};
                        var options = {};
                        options.perPage = 20;
                        options.page = $scope.page;
                        params.options = options;
                        params.companyId = staff.companyId;
                        //console.log(Q);
                        return Q.all([
                            API.travelPolicy.getAllTravelPolicy({where: {companyId:staff.companyId}}),//获取当前所有的差旅标准名称
                            API.staff.listAndPaginateStaff(params),//加载所有的员工记录
                            API.staff.statisticStaffsRole({companyId:staff.companyId}),//统计企业员工（管理员 普通员工 未激活员工 总数）数量
                            API.staff.getDistinctDepartment({companyId:staff.companyId})//企业部门
                        ])
                            .spread(function(travelPolicies,staffinfo,staffRole, departments){
                                $scope.total = staffinfo.total;
                                $scope.departments = departments;
                                //获取差旅标准
                                $scope.companyId = staff.companyId;
                                var arr = travelPolicies;
                                var i ;
                                $scope.selectClass = [
                                    {val:"",name:"请选择对应的差旅等级"}
                                ]//清空selectClass避免出现重复
                                for(i=0; i<arr.length; i++){
                                    var name = arr[i].name;
                                    var id = arr[i].id;
                                    $scope.selectClass.push({val:id,name:name});//放入option中
                                    //console.info(id);

                                }
                                //加载员工列表
                                $scope.staffs = staffinfo.items;
                                //console.info($scope.staff);
                                var tasks = $scope.staffs
                                    .map(function($staff){ //通过id拿到差旅标准的名字
                                        return Q.all([
                                            API.travelPolicy.getTravelPolicy({id:$staff.travelLevel}),
                                            API.auth.getAccountStatus({id:$staff.id})
                                        ])
                                            .spread(function(travelLevel, acc){
                                                $staff.travelLeverName = travelLevel.name;//将相应的名字赋给页面中的travelLevelName
//                                                $staff.accStatus = acc.status==0?'未激活':(acc.status == -1?'禁用': '已激活');//账户激活状态
                                                if(acc){
                                                    $staff.activeStatus = acc.status;
                                                    $staff.accStatus = acc.status==0?'未激活':'';
                                                }
                                                $scope.$apply();
                                            })
                                    });
                                //统计企业员工（管理员 普通员工 未激活员工）数量
                                $scope.forActive = staffRole.unActiveNum;
                                $scope.manager = staffRole.adminNum;
                                $scope.publicStaff = staffRole.commonStaffNum;
                                $scope.totalCount = staffRole.totalCount;
                                return Q.all(tasks)
                                    .then(function(){
                                        $scope.$apply();
                                    })
                            })
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }


        //分页
        $scope.pagination = function () {
            if ($scope.total) {
                $.jqPaginator('#pagination', {
                    totalCounts: $scope.total,
                    pageSize: 20,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page = num;
                        $scope.initstafflist();
                    }
                });
                clearInterval (pagenum);
            }
        }
        var pagenum =setInterval($scope.pagination,10);


        $scope.initstafflist();

        $scope.justInitList = function(department){
            API.onload(function(){
                var params = {};
                var options = {};
                options.perPage = 20;
                options.page = $scope.page;
                params.options = options;
                params.companyId = $scope.currentStaff.companyId;
                if(department && department!= ""){
                    params.department = department;
                }
                return API.staff.listAndPaginateStaff(params)//加载所有的员工记录
                    .then(function(staffinfo){
                        console.log(staffinfo);
                        $scope.total = staffinfo.total;
                        //加载员工列表
                        $scope.staffs = staffinfo.items;
                        var tasks = $scope.staffs
                            .map(function($staff){ //通过id拿到差旅标准的名字
                                return Q.all([
                                        API.travelPolicy.getTravelPolicy({id:$staff.travelLevel}),
                                        API.auth.getAccountStatus({id:$staff.id})
                                    ])
                                    .spread(function(travelLevel, acc){
                                        $staff.travelLeverName = travelLevel.name;//将相应的名字赋给页面中的travelLevelName
//                                                $staff.accStatus = acc.status==0?'未激活':(acc.status == -1?'禁用': '已激活');//账户激活状态
                                        if(acc){
                                            $staff.activeStatus = acc.status;
                                            $staff.accStatus = acc.status==0?'未激活':'';
                                        }
                                        $scope.$apply();
                                    })
                            });
                        return Q.all(tasks)
                            .then(function(){
                                $scope.$apply();
                            })
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })
        }

        $scope.departmentChange = function(department){
            API.onload(function(){
                var params = {};
                var options = {};
                options.perPage = 20;
                options.page = $scope.page;
                params.options = options;
                params.companyId = $scope.currentStaff.companyId;
                if(department && department!= ""){
                    params.department = department;
                }
                return API.staff.listAndPaginateStaff(params)//加载所有的员工记录
                    .then(function(staffinfo){
                        console.log(staffinfo);
                        $scope.total = staffinfo.total;
                        $.jqPaginator('#pagination', {
                            totalCounts: $scope.total,
                            pageSize: 20,
                            currentPage: 1,
                            prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                            next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                            page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                            onPageChange: function (num) {
                                $scope.page = num;
                                $scope.justInitList(department);
                            }
                        });
                        //加载员工列表
                        $scope.staffs = staffinfo.items;
                        var tasks = $scope.staffs
                            .map(function($staff){ //通过id拿到差旅标准的名字
                                return Q.all([
                                        API.travelPolicy.getTravelPolicy({id:$staff.travelLevel}),
                                        API.auth.getAccountStatus({id:$staff.id})
                                    ])
                                    .spread(function(travelLevel, acc){
                                        $staff.travelLeverName = travelLevel.name;//将相应的名字赋给页面中的travelLevelName
                                        if(acc){
                                            $staff.activeStatus = acc.status;
                                            $staff.accStatus = acc.status==0?'未激活':'';
                                        }
                                        $scope.$apply();
                                    })
                            });
                        return Q.all(tasks)
                            .then(function(){
                                $scope.$apply();
                            })
                    })
                    .catch(function(err){
                        console.info(err);
                    })
            })

        }

        /*$scope.showDepartments = function(){
            $(".departmentlist").show();
        }*/

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
            var filter  = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if(commit){
                if(!name){
                    $scope.block_tip_err = "姓名是必填项！";
                    $(".block_tip").show();
                    return;
                }else if(!mail){
                    $scope.block_tip_err = "邮箱是必填项！";
                    $(".block_tip").show();
                    return;
                }else if(!filter.test(mail)){
                    $scope.block_tip_err = "邮箱格式错误！";
                    $(".block_tip").show();
                    return;
                }else if(!power){
                    $scope.block_tip_err = "权限是必选项！";
                    $(".block_tip").show();
                    return;
                }else{
                    $(".block_tip").hide();
                }
                API.onload(function() {//创建员工
                    API.staff.createStaff({name:name,mobile:tel,email:mail,companyId:$scope.companyId,department:department,travelLevel:standard,roleId:power})
                        .then(function(staffinfo){
                            $(".add_staff").hide();
                            $(".block_tip").hide();
                            $("#add").removeClass("onCheck");
                            //$scope.initstafflist();
                            $("#staffName").val("");
                            $("#staffEmail").val("");
                            $("#staffTel").val("");
                            $("#staffDepartment").val("");
                            $scope.selectkey = "";
                            $("#staffPower").val("");
                            $scope.initstafflist();
                            $scope.$apply();
                        }).catch(function (err) {
                            console.log(err);
                            if(err.code == -29){
                                $scope.block_tip_err = "该邮箱对应的账户已存在";
                            }else if(err.code == -6){
                                $scope.block_tip_err = "邮箱与创建人邮箱后缀不一致";
                            }else{
                                $scope.block_tip_err = err.msg;
                            }
                            $(".block_tip").show();
                            $scope.$apply();
                        }).done();
                })
            }
        }


        //对员工的信息进行修改
        $scope.editStaffInfo = function(id) {
            $("#change").addClass("orange");
            API.onload(function(){
                API.staff.getStaff({id: id})
                    .then(function(staffinfo){
                        $scope.travellevel = staffinfo.staff.travelLevel;
                        $scope.selectkey = $scope.travellevel || "";
                        $scope.$apply();
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }



        //对员工所修改的信息进行保存
        $scope.updateStaffInfo = function(id,index){
            $("#change").removeClass("orange");
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
                        $scope.initstafflist();
                        $scope.$apply();
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        //取消对员工信息的修改
        $scope.cancelAddStaffInfo = function(){
            $("#change").removeClass("orange");
            $(".add_staff2").hide();
        }

        //删除员工的信息
        $scope.delStaffInfo = function(id, index) {
            //console.log(index);
            API.onload(function(){
                API.staff.deleteStaff({id:id})
                    .then(function(newStaff){
                        $scope.staffs.splice(index, 1);
                        $scope.$apply();
                        $scope.initstafflist();
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }



        //删除员工信息
        $scope.deleteInfoShow = function (id,name) {
            $scope.deleteId = id;
            $scope.deleteName = name;
            $(".messageText").html("您确定删除&quot;"+$scope.deleteName+"&quot;吗？");
            $(".confirmFixed").show();
        }
        $scope.deleteInfo = function () {
            API.onload(function(){
                API.staff.deleteStaff({id:$scope.deleteId})
                    .then(function(newStaff){
                        $(".confirmFixed").hide();
                        $scope.initstafflist();
                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })
        }

        //关闭弹窗
        $scope.confirmClose = function () {
            $(".confirmFixed,.deleteFail").hide();
        }

        //批量添加员工
        $scope.addALotStaff = function(){
            $(".staff_tab_content,.pagination").hide();
            $(".staff_tab_import").show();
            $(".staff_tab_valid").hide();
            $(".staff_import_success").hide();
            //alert(123);
        }

        //从批量添加返回到员工管理页面
        $scope.backToAddStaff = function(){
            $(".staff_tab_content,.pagination").show();
            $(".staff_tab_import").hide();
            $(".staff_tab_valid").hide();
            $(".staff_import_success").hide();
            $scope.initstafflist();
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
                            .then(function(filename){
                                console.info(filename);
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