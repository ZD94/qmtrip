/**
 * Created by seven on 2017/1/21.
 */
"use strict";
import {Staff} from "api/_types/staff/staff";
var msgbox = require('msgbox');


export async function AddStaffController($scope, $ionicPopup, $window){
    require('./add-staff.scss');
    let staff = await Staff.getCurrent();
    $scope.addStaff = function(){
        window.location.href = '#/department/new-staff'
    }

    $scope.shareLink = function(){
        window.location.href = '#/company/staff-invited'
    }

    var lastClickAt: number;
    $scope.sendImportStaffEmail = async function(){
        let seconds = 60 * 1000; //两次点击需要间隔60s
        if (lastClickAt && (new Date().valueOf() - lastClickAt) < seconds) {
            return msgbox.log('请不要频繁点击');
        }

        if(!staff.email){
            $ionicPopup.show({
                title: '邮箱未绑定',
                cssClass: 'showAlert',
                template: '<div class="popupDiv"><span>您还未绑定邮箱，请完成操作后再进行批量添加员工操作!</span></div>',
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
            let staff = await Staff.getCurrent();
            await staff.getBatchAddStaffEmail();
            var alertPop = $ionicPopup.alert({
                title:'邮件发送成功',
                template:'已发送批量添加员工的操作邮件到您绑定的邮箱，请查收并进行后续操作',
                okText: '返回'
            });
            alertPop.then(function(res){
                /*window.location.href="#/department/";*/
                $window.history.go(-1);
            })

            //防止频繁点击
            lastClickAt = new Date().valueOf();
            setTimeout( ()=> {
                lastClickAt = null;
            }, seconds);
        }
    }
}