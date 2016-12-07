import { Staff } from 'api/_types/staff/staff';
import moment = require('moment');
var msgbox = require('msgbox');

export async function EditMobileController($scope,Models,$ionicHistory) {
    $scope.isDingtalk = /dingtalk/i.test(window.navigator.userAgent);
    require('./edit-mobile.scss');
    API.require('checkcode');
    await API.onload();
    var staff = await Staff.getCurrent();
    $scope.form = {
        pwd:'',
        mobile:'',
        msgCode:''
    }

    $scope.showCount = false;
    $scope.beginCountDown = function(){
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
    $scope.sendCode = async function(){
        API.require('auth');
        API.require('checkcode');
        await API.onload();

        if (!$scope.form.mobile) {
            msgbox.log("手机号不能为空");
            return;
        }

        API.auth.checkEmailAndMobile({mobile: $scope.form.mobile})
            .then(async function(result){
                if(result){
                    return API.checkcode.getMsgCheckCode({mobile: $scope.form.mobile})
                        .then(function(result){
                            $scope.beginCountDown();
                            $scope.form.msgTicket =  result.ticket;
                        })
                }
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })
    };

    $scope.save = async function(){
        if (!$scope.form.pwd) {
            msgbox.log("登录密码不能为空");
            return;
        }
        if (!$scope.form.mobile) {
            msgbox.log("手机号不能为空");
            return;
        }
        if (!$scope.form.msgCode) {
            msgbox.log("验证码不能为空");
            return;
        }
        staff.modifyMobile({msgCode: $scope.form.msgCode, msgTicket: $scope.form.msgTicket, mobile: $scope.form.mobile, pwd: $scope.form.pwd})
            .then(function(result){
                msgbox.log("修改成功");
                $ionicHistory.goBack(-1);
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })
    }

}
