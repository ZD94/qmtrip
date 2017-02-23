/**
 * Created by seven on 2017/2/22.
 */
"use strict";
import moment = require('moment');
import validator = require('validator');
import {Staff} from "api/_types/staff/staff";
var msgbox = require('msgbox');

export async function ChangeOwnerController($scope, Models, $stateParams, $ionicPopup, $storage) {
    require('./change-owner.scss');
    let staffId = $stateParams.staffId;
    $scope.form = {
        mobile: '',
        pwd: '',
        msg: ''
    }
    let staff = await Models.staff.get(staffId);
    $scope.currentStaff = await Staff.getCurrent();
    $scope.showCount = false;
    function beginCountDown() {
        $scope.showCount = true;
        let nowTime = new Date();
        let newNow = moment(nowTime).add(90, 'seconds');
        $scope.beginNum = moment(newNow).diff(moment(), 'seconds');
        var timer = setInterval(function () {
            if ($scope.beginNum <= 0) {
                $scope.showCount = false;
                clearInterval(timer);
                $scope.$apply();
                return;
            }
            $scope.beginNum = moment(newNow).diff(moment(), 'seconds');
            $scope.$apply();
        }, 1000);
    }

    var ticket;
    $scope.sendCode = async function () {
        API.require('checkcode');
        await API.onload();
        API.checkcode.getMsgCheckCode({mobile: $scope.currentStaff.mobile})
            .then(function (result) {
                beginCountDown();
                ticket = result.ticket;
            })
            .catch(function (err) {
                msgbox.log(err.msg || err)
            })
    };
    $scope.confirmEdit = function () {
        let form = $scope.form;
        API.staff.transferOwner({pwd: form.pwd, msgCode: form.msg, msgTicket: ticket, accountId: staff.id})
            .then((reslut) => {
                $ionicPopup.show({
                    title: '转让成功',
                    template: `新的创建人为${staff.name}，您现在的角色是管理员，请重新登录系统，谢谢！`,
                    scope: $scope,
                    buttons: [
                        {
                            text: '重新登录',
                            type: 'button-positive',
                            onTap: async function () {
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
            })
            .catch(function(err){
                msgbox.log(err)
            })
    }
}