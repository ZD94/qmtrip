import _ = require('lodash');

export async function FirstSetPwdController ($scope, $stateParams) {
    let accountId = $stateParams.accountId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    API.require("auth");
    await API.onload();

    $scope.form = {
        newPwd: '',
        confirmPwd: ''
    }

    $scope.setPwd = function() {
        let newPwd = $scope.form.newPwd
        let confirmPwd = $scope.form.confirmPwd
        if (newPwd && confirmPwd) {
            newPwd = _.trim(newPwd)
            confirmPwd = _.trim(confirmPwd);
            if (newPwd != confirmPwd) {
                alert("两次密码不一致");
                return;
            }
            API.auth.resetPwdByEmail({accountId: accountId, sign: sign, timestamp: timestamp, pwd: newPwd})
                .then(function () {
                    alert("密码设置成功,请重新登录");
                    window.location.href = "index.html#/login/index";
                    return;
                })
                .catch(window.alert).done();
        } else {
            alert("输入不完整");
        }
    }
}

