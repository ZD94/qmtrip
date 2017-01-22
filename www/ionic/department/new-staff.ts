/**
 * Created by seven on 2017/1/21.
 */
"use strict";
import {Staff, EStaffRoleNames, EStaffRole} from "api/_types/staff/staff";
import {EGender} from "api/_types/index";
import L from 'common/language';
import validator = require('validator');
var msgbox = require('msgbox');

export async function NewStaffController($scope, Models, $ionicActionSheet, ngModalDlg, $stateParams, $ionicPopup, $ionicHistory){
    require('./new-staff.scss');
    let staff;
    let preRole;
    let current = await Staff.getCurrent();
    let company = current.company;
    let travelpolicylist = await company.getTravelPolicies();
    let department = await company.getDefaultDepartment();
    if($stateParams.staffId){
        staff = await Models.staff.get($stateParams.staffId);
        preRole = staff.roleId;
        let currentPolicy = await staff.getTravelPolicy();
        $scope.staffPolicyName = currentPolicy.name;
    }else {
        staff = Staff.create();
        staff.company = company;
        staff.sex = 0;
        if(travelpolicylist && travelpolicylist.length>0){
            staff.travelPolicyId = travelpolicylist[0].id;
        }
    }
    $scope.staff = staff;
    $scope.addedArray = []; //用于存放已选择的部门
    $scope.EStaffRoleNames = EStaffRoleNames;
    $scope.invoicefuc = {title:'上传头像',done:function(response){
        if(response.ret != 0){
            console.error(response.errMsg);
            $ionicPopup.alert({
                title: '错误',
                template: response.errMsg
            });
            return;
        }
        var fileId = response.fileId;
        staff.avatar = fileId[0];
    }}
    $scope.sexes = [
        {name:'男',value:EGender.MALE},
        {name:'女',value:EGender.FEMALE}
    ];
    let roles = EStaffRoleNames.map(function(rolename){
        return {text:rolename,role:EStaffRoleNames.indexOf(rolename)}
    });
    //begin 以下对于role分级暂时没用
    roles = roles.filter(function(v){
        if(current.roleId == EStaffRole.OWNER){
            if(v.role != EStaffRole.OWNER){
                return v;
            }
        }else{
            if(v.role != EStaffRole.OWNER && v.role != EStaffRole.ADMIN){
                return v;
            }
        }
    })
    //end
    $scope.chooseRole =function(){
        if(current.roleId != EStaffRole.OWNER){
            msgbox.log('你不是创建者，无法修改角色');
            return false;
        }
        let hideSheet = $ionicActionSheet.show({
            buttons:roles,
            titleText: '请选择角色',
            cancelText: '取消',
            cancel: function() {
                // add cancel code..
                return true;
            },
            buttonClicked: function(index) {
                $scope.staff.role = index;
                return true;
            }
        })
    }
    let travelPolicies = travelpolicylist.map(function(travelPolicy){
        return {text:travelPolicy.name,travelPolicy:travelPolicy}
    })
    $scope.choosePolicy = function(){
        console.info(travelPolicies);
        let hideSheet = $ionicActionSheet.show({
            buttons: travelPolicies,
            titleText: '请选择差旅标准',
            cancel: function(){

            },
            buttonClicked: function(index) {
                $scope.staff.travelPolicyId =  travelPolicies[index].travelPolicy.id; //??????不能用了？？
                $scope.staffPolicyName = travelPolicies[index].travelPolicy.name;
                return true;
            }
        })
    }
    $scope.setDepartment = async function(){
        let rootDepartment = await company.getRootDepartment();
        let childDepartments = await rootDepartment.getChildDeptStaffNum();
        let dptBeenChecked = await ngModalDlg.createDialog({
            parent: $scope,
            scope:{
                rootDepartment:rootDepartment,
                childDepartments: childDepartments,
                addedDepartments: $scope.addedArray
            },
            template: require('./staff-set-department.html'),
            controller: setDepartment
        })
        $scope.addedArray = dptBeenChecked;
    }
    function setDepartment($scope){
        require('./staff-set-department.scss');
        $scope.addToDepartments = function(departmentId){
            let idx = $scope.addedDepartments.indexOf(departmentId);
            if(idx >= 0){
                $scope.addedDepartments.splice(idx,1)
            }else{
                $scope.addedDepartments.push(departmentId);
                $scope.addedDepartments.sort();
            }
            console.info($scope.addedDepartments);
        }
    }

    $scope.saveStaff = async function(){
        let staff = $scope.staff;
        var ownerModifyAdmin = false;
        try{
            if (!staff.mobile) {
                throw L.ERR.MOBILE_EMPTY();
            }

            if (staff.mobile && !validator.isMobilePhone(staff.mobile, 'zh-CN')) {
                throw L.ERR.MOBILE_NOT_CORRECT();
            }

            if (!$stateParams.staffId) {
                //管理员添加员工只能添加普通员工
                if(current.roleId == EStaffRole.ADMIN){
                    staff.roleId = EStaffRole.COMMON;
                }
            }else{
                //如果是更新
                if(staff.mobile){
                    var account2 = await Models.account.find({where: {mobile: staff.mobile, type: 1, id: {$ne: staff.id}}, paranoid: false});

                    if (account2 && account2.length>0) {
                        throw L.ERR.MOBILE_HAS_REGISTRY();
                    }
                }
                if(!staff.name){
                    msgbox.log('姓名不能为空');
                    return;
                }
                if($scope.addedDepartments.length>0){
                    staff.departmentIds = $scope.addedDepartments;
                }else{
                    msgbox.log('部门不能为空')
                    return false;
                }
                var namePattern = /[\u4e00-\u9fa5]+/g;
                var hasChinese = namePattern.test(staff.name);
                if(staff.name.length>5 && hasChinese){
                    msgbox.log('姓名不能超过5个字');
                    return;
                }
                // 创建人修改管理员权限(二次确认)
                if(current.roleId == EStaffRole.OWNER && preRole == EStaffRole.ADMIN && staff.roleId == EStaffRole.COMMON){
                    ownerModifyAdmin = true;
                    $ionicPopup.show({
                        title: '确认要取消TA的管理员身份吗？',
                        scope: $scope,
                        buttons: [
                            {
                                text: '取消',
                                onTap: async function (e) {
                                    $scope.role = {id: true};
                                }
                            },
                            {
                                text: '确定',
                                type: 'button-positive',
                                onTap: async function (e) {
                                    staff = await staff.save();
                                    $ionicHistory.goBack(-1);
                                }
                            }
                        ]
                    })
                }
            }

            if(!ownerModifyAdmin){
                staff = await staff.save();
                $ionicHistory.goBack(-1);
            }
        }catch(err){
            if(err.code == -1){
                $scope.staff.roleId = EStaffRole.ADMIN;
            }
            msgbox.log(err.msg || err);
        }
    }
}