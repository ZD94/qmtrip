
'use strict';
var auth=(function(){
    API.require('auth');

    var  auth = {};

    //auth.loginController = function ($scope) {
    //
    //}
    auth.RegisterController = function($scope) {

        $scope.getmsgcode = function() {
            
            API.onload(function(){
                API.checkcode.getMsgCheckCode({})
                    .then(function(data){

                    }).catch(function(err){
                        console.info(err);
                    }).done();
            })

        }
        $scope.register = function() {
            var cName  = $('#corpName').val();
            var name   = $('#corpRegistryName').val();
            var mail   = $('#corpMail').val();
            var moblie = $('#corpMobile').val();
            var pwd    = $('#corpPwd').val();
            var mCode = $('#msgCode').val();
            var pCode = $('#picCode').val();
        }
    }
    return auth;
})();

module.exports = auth;