import validator = require('validator');
import moment = require('moment');
var msgbox = require('msgbox');
var xregexp = require('xregexp');

export async function InvitedStaffTwoController ($scope, $stateParams){
    let companyId = $stateParams.companyId;
    let linkId = $stateParams.linkId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    API.require("checkcode");
    API.require("auth");
    await API.onload();
    require("./login.scss");
    $scope.form = {
        mobile:'',
        msgCode:'',
        pwd:'',
        name:'',
        companyId: companyId
    };

    API.auth.checkInvitedLink({linkId: linkId, sign: sign, timestamp: timestamp})
        .then(async function (result) {
            if(result){
                if(result.company.id != companyId){
                    msgbox.log("无效链接");
                    window.location.href = "index.html#/login/invalid-link";
                }
                $scope.inviter = result.inviter;
                $scope.comoany = result.company;
            }else{
                msgbox.log("激活链接已经失效");
                window.location.href = "index.html#/login/invalid-link";
            }
        })
        .catch(function(err){
            msgbox.log(err.msg||err);
            window.location.href = "index.html#/login/invalid-link";
        }).done();

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

    $scope.sendCode = function(){
        if (!$scope.form.mobile) {
            msgbox.log("手机号不能为空");
            return;
        }
        API.auth.checkEmailAndMobile({mobile: $scope.form.mobile})
            .then(async function(){
                return API.checkcode.getMsgCheckCode({mobile: $scope.form.mobile})
                    .then(function(result){
                        $scope.beginCountDown();
                        $scope.form.msgTicket =  result.ticket;
                    })
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })

    };

    $scope.next = async function(){
        if (!$scope.form.mobile) {
            msgbox.log("手机号不能为空");
            return;
        }
        if ($scope.form.mobile && !validator.isMobilePhone($scope.form.mobile, 'zh-CN')) {
            msgbox.log("手机号格式不正确");
            return;
        }
        if (!$scope.form.msgCode) {
            msgbox.log("验证码不能为空");
            return;
        }
        if (!$scope.form.pwd) {
            msgbox.log("密码不能为空");
            return;
        }
        if (!$scope.form.name) {
            msgbox.log("姓名不能为空");
            return;
        }
        var re = xregexp('^\\pL+$');
        if (!re.test($scope.form.name)){
            msgbox.log("不能包含特殊字符");
            return;
        }
        var pwdPattern = /^[0-9a-zA-Z]*$/g;
        var newPwd = $scope.form.pwd;
        if(!pwdPattern.test(newPwd) || newPwd.length < 6 || newPwd.length >20){
            msgbox.log("密码格式应为6-20位字母或数字");
            return;
        }

        API.auth.invitedStaffRegister($scope.form)
            .then(function (result) {
                console.info(result);
                window.location.href = "index.html#/login/invited-staff-three?company="+result.name;
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            }).done();

    }
}
