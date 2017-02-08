/**
 * Created by seven on 2017/1/22.
 */
"use strict";
import {EStaffRoleNames, EStaffRole} from "api/_types/staff/staff";
import {Pager} from "common/model/pager";
var msgbox = require('msgbox');

export async function StaffInfoController($scope, Models, $stateParams, $ionicPopup, $ionicHistory){
    require('./new-staff.scss');
    API.require("auth");
    await API.onload();
    let staff = await Models.staff.get($stateParams.staffId);
    let travelPolicy = await staff.getTravelPolicy();
    let departments = await staff.getDepartments();
    $scope.EStaffRole = EStaffRole;
    //prototype Pager departmentpager
    Object.setPrototypeOf(departments, Pager.prototype);
    $scope.staff = staff;
    $scope.travelPolicy = travelPolicy;
    $scope.departments = departments;
    $scope.EStaffRoleNames = EStaffRoleNames;
    $scope.editStaff = function(){
        window.location.href = `#/department/new-staff?staffId=${staff.id}`
    }
    $scope.deleteStaff = function(){
        $ionicPopup.show({
            title: '确定删除',
            template: '确认删除该员工么？删除后无法恢复，添加需重新邀请，与该员工相关的数据统计信息也无法继续查看',
            scope: $scope,
            buttons: [
                {
                    text: '取消',
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        try{
                            await $scope.staff.destroy();
                            $ionicHistory.nextViewOptions({
                                disableBack: true,
                                expire: 300
                            });
                            window.location.href = `#/department/index`;
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        })
    }
    $scope.invitedAgain = async function(){
        //重新给员工发送激活链接
        try{
            await API.auth.reSendActiveSms({accountId: $scope.staff.id})
        }catch(err){
            msgbox.log(err.msg || err)
        }
    }
}