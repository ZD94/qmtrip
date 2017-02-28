import validator = require('validator');
import moment = require('moment');
var msgbox = require('msgbox');
var CheckUsername = require("www/util").CheckUsername;

export async function CompanyRegisterController ($scope, $stateParams){
    API.require("checkcode");
    API.require("auth");
    await API.onload();
    require("./company-register.scss");
    $scope.disable = false;
    $scope.form = {
        mobile:'',
        msgCode:'',
        pwd:'',
        name:'',
        userName:''
    };
    if($stateParams.promoCode){
        console.info('disable');
        $scope.disable = true;
        $scope.form.promoCode = $stateParams.promoCode;
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

    $scope.submitRegister = async function(){
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
            msgbox.log("企业名称不能为空");
            return;
        }
        if (!$scope.form.userName) {
            msgbox.log("联系人不能为空");
            return;
        }
        if(!CheckUsername($scope.form.userName)){
            msgbox.log("姓名格式不符合要求，请重新输入");
            return;
        }
        var pwdPattern = /^[0-9a-zA-Z]*$/g;
        var newPwd = $scope.form.pwd;
        if(!pwdPattern.test(newPwd) || newPwd.length < 6 || newPwd.length >12){
            msgbox.log("密码格式应为6-12位字母或数字");
            return;
        }

        API.auth.registerCompany($scope.form)
            .then(function (result) {
                let expiryDate = moment(result.company.expiryDate).format('YYYY年MM月DD日');
                let decrib = result.description;
                if(decrib){
                    window.location.href = '#/login/company-welcome?company='+result.company.name+'&expiryDate='+expiryDate+'&decrib='+decrib;
                }else{
                    window.location.href = '#/login/company-welcome?company='+result.company.name+'&expiryDate='+expiryDate;
                }

                // window.location.href = "index.html#/login/company-register-success?company="+result.name;
            })
            .catch(function(err){
                msgbox.log(err.msg||err);
            }).done();

    }
}
