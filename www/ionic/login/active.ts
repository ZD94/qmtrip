var msgbox = require('msgbox');
declare var API;
export async function ActiveController ($scope, $stateParams) {
    require('./active.scss');
    let accountId = $stateParams.accountId;
    let sign = $stateParams.sign;
    let timestamp = $stateParams.timestamp;
    let email = $stateParams.email;//链接失效时重新发送激活邮件使用
    await API.onload();
    $scope.invalidLink = false;

    await API.auth.activeByEmail({accountId: accountId, sign: sign, timestamp: timestamp})
        .then(function (result) {
            if(result){
                $scope.account = result;
            }
        })
        .catch(function(err){
            if(err.code == -27 && err.msg == "激活链接已经失效"){
                $scope.invalidLink = true;
                $scope.email = email;
            }else{
                msgbox.log(err.msg||err);
            }
        }).done();

    $scope.reSendActiveLink = async function(){
        try{
            var data = await API.auth.reSendActiveLink({email: email});
            if(data){
                msgbox.log("发送成功");
            }
        }catch(err){
            msgbox.log(err.msg || err);
        }
    }

    $scope.goLogin = function(){
        window.location.href = "index.html#/login/index";
    }
}
