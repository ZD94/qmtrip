/**
 * Created by seven on 2017/1/21.
 */
"use strict";
import {Staff} from "api/_types/staff/staff";

export async function AddStaffController($scope, $ionicPopup){
    require('./add-staff.scss');
    let staff = await Staff.getCurrent();
    $scope.addStaff = function(){
        window.location.href = '#/department/new-staff'
    }
    $scope.shareLink = function(){
        window.location.href = '#/company/staff-invited'
    }
    $scope.sendImportStaffEmail = async function(){
        if(!staff.email || !staff.isValidateEmail){
            $ionicPopup.show({
                title: '邮箱未绑定',
                cssClass: 'showAlert',
                template: '<div class="popupDiv"><span>您还未绑定邮箱或邮箱未激活，请完成操作后再进行批量添加员工操作!</span></div>',
                scope: $scope,
                buttons: [
                    {
                        text: '前往设置',
                        type: 'button-small button-positive',
                        onTap: async (e)=>{
                            window.location.href="index.html#/staff/staff-info";
                        }
                    }
                ]
            })
        }else{
            API.require("auth");
            await API.onload();
            await API.auth.sendImportStaffEmail({accountId: staff.id});
            var alertPop = $ionicPopup.alert({
                title:'邮件发送成功',
                template:'已发送批量添加员工的操作邮件到您绑定的邮箱，请查收并进行后续操作',
                okText: '返回'
            });
            alertPop.then(function(res){
                window.location.href="#/department/";
            })
        }
    }
}