/**
 * Created by seven on 2017/1/21.
 */
"use strict";
import {Staff} from "api/_types/staff/staff";
var msgbox = require('msgbox');

export async function AddStaffController($scope){
    require('./add-staff.scss');
    $scope.addStaff = function(){
        window.location.href = '#/department/new-staff'
    }

    $scope.shareLink = function(){
        window.location.href = '#/company/staff-invited'
    }

    var lastClickAt: number;
    $scope.batchAddStaff = async function() {
        let seconds = 60 * 1000;
        if (lastClickAt && (new Date().valueOf() - lastClickAt) < seconds) {
            return msgbox.log('请不要频繁点击');
        }
        let staff = await Staff.getCurrent();
        await staff.getBatchAddStaffEmail();
        msgbox.log('批量添加链接已发送到您的邮箱');
        lastClickAt = new Date().valueOf();
        setTimeout( ()=> {
            lastClickAt = null;
        }, seconds);
    }
}