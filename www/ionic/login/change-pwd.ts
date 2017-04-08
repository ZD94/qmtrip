/**
 * Created by seven on 2017/2/8.
 */
"use strict";
import moment = require('moment');
import {Staff} from "_types/staff/staff";
import validator = require('validator');
var msgbox = require('msgbox');
declare var API;
export async function ChangePwdController($scope, Models, $ionicPopup, $storage){
    require('./change-pwd.scss');
    $scope.form = {
        newPwd: '',
        repeatPwd: '',
        msg: ''
    }
    let staff = await Staff.getCurrent();
    $scope.showCount = false;
    function beginCountDown(){
        $scope.showCount = true;
        let nowTime = new Date();
        let newNow = moment(nowTime).add(90,'seconds');
        $scope.beginNum = moment(newNow).diff(moment(),'seconds');
        var timer = setInterval(function() {
            if ($scope.beginNum <= 0) {
                $scope.showCount = false;
                clearInterval(timer);
                $scope.$apply();
                return;
            }
            $scope.beginNum = moment(newNow).diff(moment(),'seconds');
            $scope.$apply();
        }, 1000);
    }
    var ticket;
    $scope.sendCode = async function(){
        API.require('checkcode');
        await API.onload();
        API.checkcode.getMsgCheckCode({mobile: staff.mobile})
            .then(function(result){
                beginCountDown();
                ticket = result.ticket;
            })
            .catch(function(err){
                msgbox.log(err.msg||err)
            })
    };
    $scope.savePwd = async function(){
        let newPwd = $scope.form.newPwd;
        let repeatPwd = $scope.form.repeatPwd;
        let msg = $scope.form.msg;
        if(!newPwd){
            msgbox.log('新密码不能为空');
            return
        }
        if(!repeatPwd || newPwd != repeatPwd){
            msgbox.log('两次密码输入不一致');
            return;
        }
        if(!msg){
            msgbox.log('请输入验证码');
            return;
        }
        try{
            await staff.activeByModifyPwd({pwd: $scope.form.newPwd, msgCode: $scope.form.msg, msgTicket: ticket})
            $ionicPopup.show({
                title:'密码修改成功',
                template: '密码修改成功，需要您重新登录',
                buttons: [
                    {
                        text: '重新登录',
                        type: 'button-calm',
                        onTap: async function() {
                            var browserspec = require('browserspec');
                            if (browserspec.is_wechat) {
                                await API.auth.destroyWechatOpenId({});
                            }
                            $storage.local.remove('auth_data');
                            API.reload_all_modules();
                            window.location.href = '#login/';
                            window.location.reload();
                        }
                    }
                ]
            })
        }catch(err){
            msgbox.log(err);
            return false;
        }
    }
}