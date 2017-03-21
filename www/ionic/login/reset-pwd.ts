import _ = require('lodash');
var msgbox = require('msgbox');
declare var API;
export async function ResetPwdController($scope, Models, $stateParams){
    API.require("auth");
    await API.onload();

    let accountId = $stateParams.accountId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;

    $scope.form = {
        newPwd: '',
        confirmPwd: ''
    }

    $scope.setPwd = function() {
        let newPwd = $scope.form.newPwd
        let confirmPwd = $scope.form.confirmPwd
        newPwd = _.trim(newPwd)
        confirmPwd = _.trim(confirmPwd);
        if(!newPwd){
            msgbox.log("新密码不能为空");
            return;
        }
        if(!confirmPwd){
            msgbox.log("重复密码不能为空");
            return;
        }
        if (newPwd != confirmPwd) {
            msgbox.log("两次密码不一致");
            return;
        }
        var pwdPattern = /^[0-9a-zA-Z]*$/g;
        if(!pwdPattern.test(newPwd) || newPwd.length < 6 || newPwd.length >20){
            msgbox.log("密码格式应为6-20位字母或数字");
            return;
        }
        API.auth.resetPwdByMobile({accountId: accountId, sign: sign, timestamp: timestamp, pwd: newPwd})
            .then(function () {
                alert("密码设置成功,请重新登录");
                window.location.href = "index.html#/login/index";
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            }).done();
    }

}
