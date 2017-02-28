/**
 * Created by seven on 2017/1/21.
 */
"use strict";
import {Staff, EStaffRoleNames, EStaffRole, EAddWay} from "api/_types/staff/staff";
import {EGender} from "api/_types/index";
import L from 'common/language';
import validator = require('validator');
import {Pager} from "common/model/pager";
import {type} from "os";


var _ = require('lodash');
var msgbox = require('msgbox');
var utils  = require("www/util");
let CheckUsername = utils.CheckUsername;

export async function NewStaffController($scope, Models, $ionicActionSheet, ngModalDlg, $stateParams, $ionicPopup, $ionicHistory){
    require('./new-staff.scss');
    let staff;
    let preRole;
    let staffId = $scope.staffId = $stateParams.staffId;
    let current = await Staff.getCurrent();
    let currentRole = current.roleId;
    let company = current.company;
    let travelpolicylist = await company.getTravelPolicies();
    let department = await company.getDefaultDepartment();
    $scope.selectDepartments = []; //用于存放已选择的部门
    $scope.addedArray = []; //用于存放提交时的部门id
    if(staffId){
        staff = await Models.staff.get(staffId);
        Models.resetOnPageChange(staff);
        preRole = staff.roleId;
        let currentPolicy = await staff.getTravelPolicy();
        $scope.staffPolicyName = currentPolicy.name;
        let departments = await staff.getDepartments();
        //prototype Pager departmentpager
        Object.setPrototypeOf(departments, Pager.prototype);
        $scope.selectDepartments = departments;
        departments.map(function(department){
            $scope.addedArray.push(department.id);
            $scope.addedArray.sort();
        });
    }else {
        staff = Staff.create();
        staff.company = company;
        staff.sex = 0;
        if(travelpolicylist && travelpolicylist.length>0){
            staff.travelPolicyId = travelpolicylist[0].id;
        }
        staff.isNeedChangePwd = true;
    }
    $scope.staff = staff;
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
                if(v.role != EStaffRole.OWNER){
                    return v;
                }
            }
        }
    })
    //end
    $scope.chooseRole =function(){
        if(currentRole != EStaffRole.OWNER){
            msgbox.log('你不是创建者，无法修改角色');
            return false;
        }
        let hideSheet = $ionicActionSheet.show({
            buttons:roles,
            titleText: '请选择角色',
            cancelText: '取消',
            destructiveText: '转让创建人',
            destructiveButtonClicked: function(){
                $ionicPopup.show({
                    title: '转让创建人',
                    template: `创建人身份转让后，您将变为普通管理员，所有创建人的权限将转移给${staff.name}，确认转让么？`,
                    scope: $scope,
                    buttons: [
                        {
                            text: '取消',
                            type: 'button-outline button-positive'
                        },
                        {
                            text: '确认',
                            type: 'button-positive',
                            onTap: function(){
                                window.location.href = `#/department/change-owner?staffId=${staff.id}`;
                            }
                        }
                    ]
                })
            },
            cancel: function() {
                // add cancel code..
                return true;
            },
            buttonClicked: function(index) {
                $scope.staff.roleId = roles[index].role;
                return true;
            }
        })
    }
    let travelPolicies = travelpolicylist.map(function(travelPolicy){
        return {text:travelPolicy.name,travelPolicy:travelPolicy}
    })
    $scope.choosePolicy = function(){
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
                addedDepartments: $scope.selectDepartments
            },
            template: require('./staff-set-department.html'),
            controller: setDepartment
        })
        $scope.selectDepartments = dptBeenChecked;
        if(dptBeenChecked){
            $scope.addedArray = [];
            dptBeenChecked.map(function(deparment){
                $scope.addedArray.push(deparment.id);
                $scope.addedArray.sort();
            })
        }
    }
    async function setDepartment($scope){
        require('./staff-set-department.scss');
        $scope.oldDepartments = _.clone($scope.addedDepartments)
        // $scope.oldDepartments = oldDepartments;
        $scope.childDepartments = await Promise.all($scope.childDepartments.map(async function(department) {
            let childDepartment = await department.getChildDeptStaffNum();
            if(childDepartment && childDepartment.length>0){
                department.hasChild = true;
            }else{
                department.hasChild = false;
            }
            return department;
        }));
        $scope.selected = function(department){
            $scope.hasSelect = false;
            $scope.addedDepartments.map(function(added,index){
                if(added.id == department.id){
                    $scope.hasSelect = true;
                }
            })
            return $scope.hasSelect;
        }
        $scope.addToDepartments = function(department){
            // let idx = $scope.addedDepartments.indexOf(department);  //数组元素为obj，indexof只能用于str
            $scope.idx = -1;
            $scope.addedDepartments.map(function(added,index){
                if(added.id == department.id){
                    $scope.idx = index;
                }
            })
            if($scope.idx >= 0){
                $scope.addedDepartments.splice($scope.idx,1)
            }else{
                $scope.addedDepartments.push(department);
                $scope.addedDepartments.sort();
            }
        }
        $scope.showChild = async function(department){
            $scope.rootDepartment = department;
            let childDepartments = await department.getChildDeptStaffNum();
            $scope.childDepartments = await Promise.all(childDepartments.map(async function(department) {
                let childDepartment = await department.getChildDeptStaffNum();
                if(childDepartment && childDepartment.length>0){
                    department.hasChild = true;
                }else{
                    department.hasChild = false;
                }
                return department;
            }));
        }
        $scope.backParent = async function(parentDdepartment){
            let childDepartments = await parentDdepartment.getChildDeptStaffNum();
            $scope.childDepartments = await Promise.all(childDepartments.map(async function(department) {
                let childDepartment = await department.getChildDeptStaffNum();
                if(childDepartment && childDepartment.length>0){
                    department.hasChild = true;
                }else{
                    department.hasChild = false;
                }
                return department;
            }));
            $scope.rootDepartment = parentDdepartment;
        }
        $scope.confirm = function(department){
            $scope.confirmModal(department);
        }
    }
    $scope.saveStaff = async function(){
        $ionicHistory.nextViewOptions({
            /*disableBack: true,*/
            disableBack: false,
            expire: 300
        });
        if($scope.staffId){
            await $scope.staff.deleteStaffDepartments();
        }
        staffSave(BackToDetail)
    }
    $scope.addAnother = function(){
        $ionicHistory.nextViewOptions({
            /*disableBack: true,*/
            disableBack: false,
            expire: 300
        });
        staffSave(AddAnotherOne);
    }
    async function staffSave(callback){
        let staff = $scope.staff;
        var ownerModifyAdmin = false;

        if(!staff.name){
            msgbox.log('姓名不能为空');
            return;
        }
        if(!CheckUsername(staff.name)){
            msgbox.log('姓名格式不符合要求，请重新输入');
            return;
        }

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
                    var account2 = await Models.account.find({where: {mobile: staff.mobile, type: 1, id: {$ne: staff.id}}});

                    if (account2 && account2.length>0) {
                        throw L.ERR.MOBILE_HAS_REGISTRY();
                    }
                }
                

                if($scope.addedArray.length>0){
                    // staff.departmentIds = $scope.addedArray;
                }else{
                    msgbox.log('部门不能为空')
                    return false;
                }
                // var namePattern = /[\u4e00-\u9fa5]+/g;
                // var hasChinese = namePattern.test(staff.name);
                // if(staff.name.length>5 && hasChinese){
                //     msgbox.log('姓名不能超过5个字');
                //     return;
                // }
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
                                    await staff.saveStaffDepartments($scope.addedArray);
                                    callback();
                                }
                            }
                        ]
                    })
                }
            }

            if(!ownerModifyAdmin){
                staff = await staff.save();
                await staff.saveStaffDepartments($scope.addedArray);
                callback();
            }
        }catch(err){
            if(err.code == -1){
                $scope.staff.roleId = EStaffRole.ADMIN;
            }
            msgbox.log(err.msg || err);
        }
    }
    function BackToDetail(){
        window.location.href = `#/department/staff-info?staffId=${$scope.staff.id}`
    }
    function AddAnotherOne(){
        staff = Staff.create();
        staff.company = company;
        staff.sex = 0;
        if(travelpolicylist && travelpolicylist.length>0){
            staff.travelPolicyId = travelpolicylist[0].id;
        }
        $scope.staff = staff;
        $scope.staffPolicyName = '';
        $scope.selectDepartments = [];
    }
}