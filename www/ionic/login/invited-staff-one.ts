var msgbox = require('msgbox');

export async function InvitedStaffOneController ($scope, $stateParams, $storage , $ionicPopup){
    require("./login.scss");
    let linkId = $stateParams.linkId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    API.require("auth");
    await API.onload();
    var auth_data = $storage.local.get('auth_data');
    await API.auth.checkInvitedLink({linkId: linkId, sign: sign, timestamp: timestamp})
        .then(async function (result) {
            if(result){
                $scope.inviter = result.inviter;
                $scope.comoany = result.company;
                if(auth_data && auth_data.user_id && $scope.inviter && auth_data.user_id == $scope.inviter.id){
                    //显示遮罩层
                    $ionicPopup.show({
                        template: '<p>请使用浏览器分享功能<br>将页面分享给好友</p>',
                        cssClass: 'share_alert'
                    })
                }
            }else{
                msgbox.log("激活链接已经失效");
                window.location.href = "index.html#/login/invalid-link";
            }
        })
        .catch(function(err){
            msgbox.log(err.msg||err);
            window.location.href = "index.html#/login/invalid-link";
        }).done();

    $scope.goRegister = function(){
        window.location.href = "index.html#/login/invited-staff-two?companyId="+$scope.comoany.id+"&linkId="+linkId+"&sign="+sign+"&timestamp="+timestamp;
    }
}
