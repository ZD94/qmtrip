import { Staff } from 'api/_types/staff/staff';
var msgbox = require('msgbox');

export async function EditPwdController($scope,Models,$ionicHistory,$storage,$ionicPopup) {
    $scope.isDingtalk = /dingtalk/i.test(window.navigator.userAgent);
    require('./edit-mobile.scss');
    await API.onload();
    var staff = await Staff.getCurrent();
    $scope.form = {
        oldPwd:'',
        newPwd:'',
        confirmPwd:''
    }

    $scope.save = async function(){
        if (!$scope.form.oldPwd) {
            msgbox.log("登录密码不能为空");
            return;
        }
        if (!$scope.form.newPwd) {
            msgbox.log("新密码能为空");
            return;
        }
        if (!$scope.form.confirmPwd) {
            msgbox.log("确认密码能为空");
            return;
        }
        if ($scope.form.oldPwd == $scope.form.newPwd) {
            msgbox.log("原密码与新密码不能相同");
            return;
        }
        if ($scope.form.confirmPwd != $scope.form.newPwd) {
            msgbox.log("新密码与确认密码不一致");
            return;
        }
        var pwdPattern = /^[0-9a-zA-Z]*$/g;
        var newPwd = $scope.form.newPwd;
        if(!pwdPattern.test(newPwd) || newPwd.length < 6 || newPwd.length >20){
            msgbox.log("密码格式应为6-20位字母或数字");
            return;
        }
        await API.onload();
        staff.modifyPwd({ newPwd: $scope.form.newPwd, pwd: $scope.form.oldPwd })
            .then(async function(result){
                $ionicPopup.show({
                    template: '<span>修改成功，请重新登录</span>',
                    title: '修改密码',
                    scope: $scope,
                    buttons: [
                        {
                            text: '确定',
                            type: 'button-positive',
                            onTap: async function (e) {
                                $scope.logout();
                            }
                        }
                    ]
                })
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })
    }

    $scope.logout = async function () {
        var browserspec = require('browserspec');
        if (browserspec.is_wechat) {
            await API.auth.destroyWechatOpenId({});
        }
        await API.onload();
        $storage.local.remove('auth_data');
        API.reload_all_modules();
        window.location.href = '#login/';
        window.location.reload();
    }
}