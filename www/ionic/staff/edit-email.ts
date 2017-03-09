import { Staff } from '_types/staff/staff';

var msgbox = require('msgbox');
declare var API;
export async function EditEmailController($scope, Models, $ionicHistory, $ionicPopup) {
    $scope.isDingtalk = /dingtalk/i.test(window.navigator.userAgent);
    require('./edit-mobile.scss');
    await API.onload();
    var staff = await Staff.getCurrent();
    $scope.form = {
        pwd:'',
        email:''
    }
    $scope.save = async function(){
        if (!$scope.form.pwd) {
            msgbox.log("登录密码不能为空");
            return;
        }
        if (!$scope.form.email) {
            msgbox.log("邮箱不能为空");
            return;
        }
        staff.modifyEmail({ email: $scope.form.email, pwd: $scope.form.pwd })
            .then(async function(result){
                await API.onload();
                return API.auth.reSendActiveLink({email: $scope.form.email, accountId: staff.id});
            })
            .then(function(data){
                if(data){
                    $ionicPopup.alert({
                        title:'激活邮件发送成功',
                        template:'为保障您的权益和能够及时收到通知消息，请尽快到邮箱进行激活！',
                        okText:'确定'
                    }).then(function(res){
                        window.location.href = "index.html#/staff/staff-info";
                    })
                    // window.location.href = "index.html#/staff/edit-email-success";
                }
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            })
    }
}
