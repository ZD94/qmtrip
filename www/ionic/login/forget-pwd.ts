import moment = require('moment');
import validator = require('validator');
var msgbox = require('msgbox');
declare var API;
export async function ForgetPwdController($scope,Models) {
    require("./forget-pwd.scss");
    API.require("auth");
    API.require("checkcode");
    $scope.form = {
        mobile:'',
        msgCode:''
    };
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

    var ticket;
    $scope.sendCode = async function(){
        if(!$scope.form.mobile){
            msgbox.log("手机号不能为空");
            return;
        }
        if ( !validator.isMobilePhone($scope.form.mobile, 'zh-CN')) {
            msgbox.log("手机号格式不正确");
            return;
        }
        await API.onload();
        API.checkcode.getMsgCheckCode({mobile: $scope.form.mobile})
            .then(function(result){
                $scope.beginCountDown();
                ticket = result.ticket;
            })
            .catch(function(err){
                msgbox.log(err.msg||err)
            })
    };
    $scope.nextStep = async function(){
        if(!$scope.form.mobile){
            msgbox.log("手机号不能为空");
            return;
        }
        if(!$scope.form.msgCode){
            msgbox.log("验证码不能为空");
            return;
        }
        if(!ticket){
            msgbox.log("验证码不正确");
            return;
        }
        await API.onload();
        API.auth.validateMsgCheckCode({msgCode: $scope.form.msgCode, msgTicket: ticket, mobile: $scope.form.mobile})
            .then(function(result){
                if(result){
                    window.location.href= "index.html#/login/reset-pwd?accountId="+result.accountId+"&sign="+result.sign+"&timestamp="+result.expireAt;
                }else{
                    msgbox.log("验证码错误");
                }
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })

    }
}
